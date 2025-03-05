import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import { AvailableFetcherApis } from "./grpc-gen/main";
import { ISnowballR } from "./grpc-gen/main.grpc-server";
import { Nothing, Id, BoolValue, Blob } from "./grpc-gen/base";
import {
    LoginRequest,
    LoginSecret,
    PasswordChangeRequest,
    PasswordResetRequest,
    RegisterRequest,
    RenewRequest,
    RequestPasswordResetRequest,
} from "./grpc-gen/authentication";
import { User, User_List, User_Update, UserRole, UserStatus } from "./grpc-gen/user";
import {
    MemberRole,
    PaperDecision,
    Project,
    Project_Create,
    Project_List,
    Project_Member_Invite,
    Project_Member_List,
    Project_Member_Remove,
    Project_Paper,
    Project_Paper_Add,
    Project_Paper_List,
    Project_Paper_Update,
    Project_Statistics,
    Project_Statistics_Get,
    Project_Update,
    ProjectStatus,
    SnowballingType,
} from "./grpc-gen/project";
import { UserSettings, UserSettings_Update } from "./grpc-gen/user_settings";
import { Paper, Paper_List, Paper_PdfUpdate, Paper_Update } from "./grpc-gen/paper";
import { ExportRequest } from "./grpc-gen/export";
import {
    Criterion,
    Criterion_Create,
    Criterion_List,
    Criterion_Update,
} from "./grpc-gen/criterion";
import { Review, Review_Create, Review_List, Review_Update } from "./grpc-gen/review";
import { status } from "@grpc/grpc-js";
import {
    addProjectPaperReviews,
    AVAILABLE_FETCHERS,
    CRITERIA,
    MEMBERS,
    PAPER_PDFS,
    PAPER_REVIEWS,
    PAPERS,
    PROGRESS,
    PROJECT_CRITERIA,
    PROJECT_PAPERS,
    PROJECT_PROJECT_PAPERS,
    PROJECTS,
    READING_LISTS,
    REVIEWS,
    USER_SETTINGS,
    USERS,
} from "./model";
import {
    anythingUndefined,
    findFirst,
    getAuthenticated,
    getNextId,
    isEmpty,
    randomToken,
    toUser,
} from "./util";
import { applyFieldMask } from "protobuf-fieldmask";

export const snowballRService: ISnowballR = {
    getAvailableFetcherApis: function (
        _: ServerUnaryCall<Nothing, AvailableFetcherApis>,
        callback: sendUnaryData<AvailableFetcherApis>,
    ): void {
        callback(null, { fetcherApis: AVAILABLE_FETCHERS });
    },
    register: function (
        call: ServerUnaryCall<RegisterRequest, LoginSecret>,
        callback: sendUnaryData<LoginSecret>,
    ): void {
        const { lastName, firstName, password, email } = call.request;
        if (USERS.has(email)) {
            callback({ code: status.ALREADY_EXISTS });
            return;
        }

        const emptyParams = Object.entries(call.request).filter((p) => isEmpty(p[1]));
        if (emptyParams.length != 0) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: `${emptyParams.map((p) => p[1]).join(", ")} are empty`,
            });
            return;
        }

        const accessToken = randomToken();
        const refreshToken = randomToken();

        USERS.set(email, {
            id: email,
            email,
            firstName,
            lastName,
            role: UserRole.DEFAULT,
            status: UserStatus.ACTIVE,
            password,
            accessToken,
            refreshToken,
        });
        USER_SETTINGS.set(email, {
            showHotkeys: false,
            reviewMode: false,
            defaultCriteria: {
                criteria: [],
            },
            defaultProjectSettings: {
                similarityThreshold: 0.5,
                decisionMatrix: undefined,
                fetcherApis: AVAILABLE_FETCHERS,
                snowballingType: SnowballingType.BOTH,
                reviewMaybeAllowed: true,
            },
        });
        READING_LISTS.set(email, []);

        callback(null, {
            accessToken,
            refreshToken,
        });
    },
    login: function (
        call: ServerUnaryCall<LoginRequest, LoginSecret>,
        callback: sendUnaryData<LoginSecret>,
    ): void {
        const { email, password } = call.request;
        if (!USERS.has(email) || USERS.get(email)?.password != password) {
            callback({ code: status.PERMISSION_DENIED });
            return;
        }

        const { accessToken, refreshToken } = USERS.get(email)!;

        callback(null, {
            accessToken,
            refreshToken,
        });
    },
    logout: function (
        call: ServerUnaryCall<Nothing, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        USERS.set(user.email, {
            ...user,
            accessToken: randomToken(),
            refreshToken: randomToken(),
        });
        callback(null);
    },
    isAuthenticated: function (
        call: ServerUnaryCall<Nothing, BoolValue>,
        callback: sendUnaryData<BoolValue>,
    ): void {
        const user = getAuthenticated(call.metadata);
        callback(null, {
            value: user != null,
        });
    },
    renewSession: function (
        call: ServerUnaryCall<RenewRequest, LoginSecret>,
        callback: sendUnaryData<LoginSecret>,
    ): void {
        const user = getAuthenticated(call.metadata);

        callback(null, {
            accessToken: user?.accessToken ?? "",
            refreshToken: user?.refreshToken ?? "",
        });
    },
    requestPasswordReset: function (
        call: ServerUnaryCall<RequestPasswordResetRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { email } = call.request;
        if (USERS.has(email)) {
            USERS.get(email)!.password = "reset";
        }
        callback(null, {});
    },
    resetPassword: function (
        _: ServerUnaryCall<PasswordResetRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        callback({
            code: status.UNIMPLEMENTED,
        });
    },
    changePassword: function (
        call: ServerUnaryCall<PasswordChangeRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { oldPassword, newPassword } = call.request;
        const user = getAuthenticated(call.metadata)!;

        if (user.password == oldPassword) {
            USERS.get(user.email)!.password = newPassword;
            callback(null, {});
        } else {
            callback({
                code: status.UNAUTHENTICATED,
                details: "The old password is incorrect",
            });
        }
    },
    getAllUsers: function (
        _: ServerUnaryCall<Nothing, User_List>,
        callback: sendUnaryData<User_List>,
    ): void {
        callback(null, {
            users: Array.from(USERS.values()).map(toUser),
        });
    },
    getCurrentUser: function (
        call: ServerUnaryCall<Nothing, User>,
        callback: sendUnaryData<User>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, toUser(user));
    },
    getUserById: function (call: ServerUnaryCall<Id, User>, callback: sendUnaryData<User>): void {
        const user = findFirst(USERS.values(), "id", call.request.id);
        if (user == null) {
            callback({
                code: status.NOT_FOUND,
                details: "User with given id was not found",
            });
        } else {
            callback(null, toUser(user));
        }
    },
    getUserByEmail: function (
        call: ServerUnaryCall<Id, User>,
        callback: sendUnaryData<User>,
    ): void {
        const email = call.request.id;
        if (USERS.has(email)) {
            callback(null, toUser(USERS.get(email)!));
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "User with given email was not found",
            });
        }
    },
    updateUser: function (
        call: ServerUnaryCall<User_Update, User>,
        callback: sendUnaryData<User>,
    ): void {
        const { user, mask } = call.request;

        if (user?.id == null) {
            callback({
                code: status.INVALID_ARGUMENT,
            });
            return;
        }

        if (!USERS.has(user.id)) {
            callback({
                code: status.NOT_FOUND,
            });
            return;
        }

        const currentUser = USERS.get(user.id)!;

        const update = mask == null ? user : applyFieldMask(user, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        USERS.set(user.id, {
            ...currentUser,
            ...update,
        });

        callback(null, USERS.get(user.id));
    },
    softDeleteUser: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!USERS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "User not found",
            });
            return;
        }

        USERS.get(id)!.status = UserStatus.DELETED;
        callback(null, {});
    },
    softUndeleteUser: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!USERS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "User not found",
            });
            return;
        }

        USERS.get(id)!.status = UserStatus.ACTIVE;
        callback(null, {});
    },
    getAllPapersToReview: function (
        _: ServerUnaryCall<Nothing, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        callback(null, {
            projectPapers: Array.from(PROJECT_PAPERS.values()).filter(
                (pp) => pp.decision == PaperDecision.UNDECIDED,
            ).map(addProjectPaperReviews),
        });
    },
    getPapersToReviewForProject: function (
        call: ServerUnaryCall<Id, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        const { id } = call.request;

        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        callback(null, {
            projectPapers: (PROJECT_PROJECT_PAPERS.get(id) ?? [])
                .map((ppp) => PROJECT_PAPERS.get(ppp)!)
                .filter((pp) => pp.decision == PaperDecision.UNDECIDED)
                .map(addProjectPaperReviews),
        });
    },
    getUserSettings: function (
        call: ServerUnaryCall<Nothing, UserSettings>,
        callback: sendUnaryData<UserSettings>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, USER_SETTINGS.get(user.id)!);
    },
    updateUserSettings: function (
        call: ServerUnaryCall<UserSettings_Update, UserSettings>,
        callback: sendUnaryData<UserSettings>,
    ): void {
        const { userSettings, mask } = call.request;
        const user = getAuthenticated(call.metadata)!;
        const currentSettings = USER_SETTINGS.get(user.id)!;

        if (userSettings == null) {
            callback({
                code: status.INVALID_ARGUMENT,
            });
            return;
        }

        const update = mask == null ? userSettings : applyFieldMask(userSettings, mask.paths);

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        USER_SETTINGS.set(user.id, {
            ...currentSettings,
            ...(update as UserSettings),
        });
        callback(null, USER_SETTINGS.get(user.id)!);
    },
    getReadingList: function (
        call: ServerUnaryCall<Nothing, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, {
            papers: READING_LISTS.get(user.id)!,
        });
    },
    isPaperOnReadingList: function (
        call: ServerUnaryCall<Id, BoolValue>,
        callback: sendUnaryData<BoolValue>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        callback(null, {
            value: READING_LISTS.get(user.id)!.some((p) => p.id == id),
        });
    },
    addPaperToReadingList: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        const paper = PAPERS.get(id);
        if (paper == undefined) {
            callback({
                code: status.NOT_FOUND,
                details: "The provided paper does not exist",
            });
        } else {
            READING_LISTS.get(user.id)!.push(paper);
            callback(null, {});
        }
    },
    removePaperFromReadingList: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        if (READING_LISTS.get(user.id)?.some((p) => p.id == id)) {
            READING_LISTS.set(
                user.id,
                READING_LISTS.get(user.id)!.filter((p) => p.id != id),
            );
            callback(null, {});
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Paper id not found in reading list",
            });
        }
    },
    getPendingInvitationsForUser: function (
        _: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        // TODO
        callback({
            code: status.UNIMPLEMENTED,
        });
    },
    inviteUserToProject: function (
        _: ServerUnaryCall<Project_Member_Invite, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        // TODO
        callback({
            code: status.UNIMPLEMENTED,
        });
    },
    getPendingInvitationsForProject: function (
        _: ServerUnaryCall<Id, User_List>,
        callback: sendUnaryData<User_List>,
    ): void {
        callback(null, {
            users: [],
        });
    },
    getProjectMembers: function (
        call: ServerUnaryCall<Id, Project_Member_List>,
        callback: sendUnaryData<Project_Member_List>,
    ): void {
        const { id } = call.request;

        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project does not exist",
            });
            return;
        }

        callback(null, {
            members: MEMBERS.get(id)!,
        });
    },
    removeProjectMember: function (
        call: ServerUnaryCall<Project_Member_Remove, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { projectId, userId } = call.request;

        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project does not exist",
            });
            return;
        }

        MEMBERS.set(
            projectId,
            MEMBERS.get(projectId)!.filter((p) => p.user?.id != userId),
        );
        callback(null, {});
    },
    getAllProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter((p) => p.status == ProjectStatus.ACTIVE),
        });
    },
    getAllDeletedProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter(
                (p) => p.status == ProjectStatus.DELETED,
            ),
        });
    },
    getAllDeletedProjectsForUser: function (
        call: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        const { id } = call.request;
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter(
                (p) =>
                    p.status == ProjectStatus.DELETED &&
                    MEMBERS.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    getAllArchivedProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter(
                (p) => p.status == ProjectStatus.ARCHIVED,
            ),
        });
    },
    getAllProjectsForUser: function (
        call: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        const { id } = call.request;
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter(
                (p) =>
                    p.status == ProjectStatus.ACTIVE &&
                    MEMBERS.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    getAllArchivedProjectsForUser: function (
        call: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        const { id } = call.request;
        callback(null, {
            projects: Array.from(PROJECTS.values()).filter(
                (p) =>
                    p.status == ProjectStatus.ARCHIVED &&
                    MEMBERS.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    createProject: function (
        call: ServerUnaryCall<Project_Create, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { name } = call.request;
        const id = PROJECTS.size.toString();
        PROJECTS.set(id, {
            id: id,
            name: name,
            status: ProjectStatus.ACTIVE,
            currentStage: 0n,
            maxStage: 0n,
            ...USER_SETTINGS.get(user.id)?.defaultProjectSettings,
        });
        MEMBERS.set(id, [
            {
                role: MemberRole.ADMIN,
                user: user,
            },
        ]);
        PROGRESS.set(id, Math.random());
        PROJECT_CRITERIA.set(id, []);
        PROJECT_PROJECT_PAPERS.set(id, []);
        callback(null, PROJECTS.get(id)!);
    },
    getProjectById: function (
        call: ServerUnaryCall<Id, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { id } = call.request;
        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project was not found",
            });
            return;
        }

        callback(null, PROJECTS.get(id)!);
    },
    updateProject: function (
        call: ServerUnaryCall<Project_Update, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { project, mask } = call.request;

        if (project?.id == undefined || !PROJECTS.has(project.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project was not found",
            });
            return;
        }

        const currentProject = PROJECTS.get(project.id)!;
        const update = mask == null ? project : applyFieldMask(project, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        PROJECTS.set(project.id, {
            ...currentProject,
            ...(update as Project),
        });
        callback(null, PROJECTS.get(project.id)!);
    },
    exportProject: function (
        _: ServerUnaryCall<ExportRequest, Blob>,
        callback: sendUnaryData<Blob>,
    ): void {
        // TODO
        callback({
            code: status.UNIMPLEMENTED,
        });
    },
    softDeleteProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        PROJECTS.get(id)!.status = ProjectStatus.DELETED;
        callback(null, {});
    },
    softUndeleteProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        PROJECTS.get(id)!.status = ProjectStatus.ACTIVE;
        callback(null, {});
    },
    getProjectStatistics: function (
        call: ServerUnaryCall<Project_Statistics_Get, Project_Statistics>,
        callback: sendUnaryData<Project_Statistics>,
    ): void {
        const { projectId } = call.request;

        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        callback(null, {
            projectProgress: PROGRESS.get(projectId)!,
        });
    },
    getCriterionById: function (
        call: ServerUnaryCall<Id, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { id } = call.request;
        if (CRITERIA.has(id)) {
            callback(null, CRITERIA.get(id)!);
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Criterion not found",
            });
        }
    },
    getAllCriteriaForProject: function (
        call: ServerUnaryCall<Id, Criterion_List>,
        callback: sendUnaryData<Criterion_List>,
    ): void {
        const { id } = call.request;
        if (PROJECT_CRITERIA.has(id)) {
            callback(null, {
                criteria: PROJECT_CRITERIA.get(id)!.map((id) => CRITERIA.get(id)!),
            });
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
        }
    },
    createCriterion: function (
        call: ServerUnaryCall<Criterion_Create, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { category, description, projectId, tag, name } = call.request;
        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        const id = CRITERIA.size.toString();
        CRITERIA.set(id, {
            id: id,
            tag: tag,
            name: name,
            description: description,
            category: category,
        });

        PROJECT_CRITERIA.get(projectId)!.push(id);
        callback(null, CRITERIA.get(id)!);
    },
    updateCriterion: function (
        call: ServerUnaryCall<Criterion_Update, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { criterion, mask } = call.request;

        if (criterion?.id == null) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Id must not be undefined",
            });
            return;
        }

        if (!CRITERIA.has(criterion.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Criterion not found",
            });
            return;
        }

        const currentCriterion = CRITERIA.get(criterion.id)!;
        const update = mask == null ? criterion : applyFieldMask(criterion, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        CRITERIA.set(criterion.id, {
            ...currentCriterion,
            ...(update as Criterion),
        });
        callback(null, CRITERIA.get(criterion.id));
    },
    deleteCriterion: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectId, criteria] of PROJECT_CRITERIA) {
            PROJECT_CRITERIA.set(
                projectId,
                criteria.filter((c) => c != id),
            );
        }
        callback(null, {});
    },
    getProjectPaperById: function (
        call: ServerUnaryCall<Id, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { id } = call.request;
        if (PROJECT_PAPERS.has(id)) {
            callback(null, addProjectPaperReviews(PROJECT_PAPERS.get(id)!));
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project Paper not found",
            });
        }
    },
    getAllProjectPapersForProject: function (
        call: ServerUnaryCall<Id, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        const { id } = call.request;
        if (PROJECTS.has(id)) {
            callback(null, {
                projectPapers: PROJECT_PROJECT_PAPERS.get(id)!.map(
                    (ppp) => PROJECT_PAPERS.get(ppp)!,
                ).map(addProjectPaperReviews),
            });
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
        }
    },
    addPaperToProject: function (
        call: ServerUnaryCall<Project_Paper_Add, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { projectId, paperId, stage } = call.request;
        if (PROJECTS.has(projectId)) {
            const id = getNextId(PROJECT_PAPERS);
            const project_paper: Project_Paper = {
                id: id,
                stage: stage,
                decision: PaperDecision.UNDECIDED,
                reviews: [],
                paper: PAPERS.get(paperId)!,
            };
            PROJECT_PAPERS.set(id, project_paper);
            PAPER_REVIEWS.set(id, []);
            PROJECT_PROJECT_PAPERS.get(projectId)!.push(id);
            callback(null, project_paper);
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
        }
    },
    updateProjectPaper: function (
        call: ServerUnaryCall<Project_Paper_Update, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { projectPaper, mask } = call.request;

        if (projectPaper?.id == null) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Id must not be undefined",
            });
            return;
        }

        if (!PROJECT_PAPERS.has(projectPaper.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project paper not found",
            });
            return;
        }

        const currentProjectPaper = PROJECT_PAPERS.get(projectPaper.id)!;
        const update = mask == null ? projectPaper : applyFieldMask(projectPaper, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        PROJECT_PAPERS.set(projectPaper.id, {
            ...currentProjectPaper,
            ...(update as Project_Paper),
        });
        callback(null, addProjectPaperReviews(PROJECT_PAPERS.get(projectPaper.id)!));
    },
    removePaperFromProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectId, ppp] of PROJECT_PROJECT_PAPERS) {
            PROJECT_PROJECT_PAPERS.set(
                projectId,
                ppp.filter((p) => p != id),
            );
        }
        callback(null, {});
    },
    getReviewById: function (
        call: ServerUnaryCall<Id, Review>,
        callback: sendUnaryData<Review>,
    ): void {
        const { id } = call.request;
        if (REVIEWS.has(id)) {
            callback(null, REVIEWS.get(id)!);
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Review not found",
            });
        }
    },
    getAllReviewsForProjectPaper: function (
        call: ServerUnaryCall<Id, Review_List>,
        callback: sendUnaryData<Review_List>,
    ): void {
        const { id } = call.request;
        if (PAPER_REVIEWS.has(id)) {
            callback(null, {
                reviews: PAPER_REVIEWS.get(id)!.map((id) => REVIEWS.get(id)!),
            });
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Review not found",
            });
        }
    },
    createReview: function (
        call: ServerUnaryCall<Review_Create, Review>,
        callback: sendUnaryData<Review>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { projectPaperId, selectedCriteriaIds, decision } = call.request;
        if (!PROJECT_PAPERS.has(projectPaperId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project paper not found",
            });
            return;
        }

        const id = REVIEWS.size.toString();
        REVIEWS.set(id, {
            id: id,
            userId: user.id,
            decision: decision,
            selectedCriteriaIds: selectedCriteriaIds,
        });

        PAPER_REVIEWS.get(projectPaperId)!.push(id);
        callback(null, REVIEWS.get(id)!);
    },
    updateReview: function (
        call: ServerUnaryCall<Review_Update, Review>,
        callback: sendUnaryData<Review>,
    ): void {
        const { review, mask } = call.request;

        if (review?.id == null) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Id must not be undefined",
            });
            return;
        }

        if (!REVIEWS.has(review.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Review not found",
            });
            return;
        }

        const currentReview = REVIEWS.get(review.id)!;
        const update = mask == null ? review : applyFieldMask(review, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        REVIEWS.set(review.id, {
            ...currentReview,
            ...(update as Review),
        });
        callback(null, REVIEWS.get(review.id)!);
    },
    deleteReview: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectPaperId, reviews] of PAPER_REVIEWS) {
            PAPER_REVIEWS.set(
                projectPaperId,
                reviews.filter((c) => c != id),
            );
        }
        callback(null, {});
    },
    getPaperById: function (
        call: ServerUnaryCall<Id, Paper>,
        callback: sendUnaryData<Paper>,
    ): void {
        const { id } = call.request;
        if (PAPERS.has(id)) {
            callback(null, PAPERS.get(id)!);
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
        }
    },
    createPaper: function (
        call: ServerUnaryCall<Paper, Paper>,
        callback: sendUnaryData<Paper>,
    ): void {
        const create = call.request;
        const id = PAPERS.size.toString();
        PAPERS.set(id, {
            ...create,
            id: id,
        });
        PAPER_PDFS.set(id, new Uint8Array());
        callback(null, PAPERS.get(id)!);
    },
    updatePaper: function (
        call: ServerUnaryCall<Paper_Update, Paper>,
        callback: sendUnaryData<Paper>,
    ): void {
        const { paper, mask } = call.request;

        if (paper?.id == null) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Id must not be undefined",
            });
            return;
        }

        if (!PAPERS.has(paper.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
            return;
        }

        const currentPaper = PAPERS.get(paper.id)!;
        const update = mask == null ? paper : applyFieldMask(paper, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "A provided field specified by the field mask was undefined",
            });
            return;
        }

        PAPERS.set(paper.id, {
            ...currentPaper,
            ...(update as Paper),
        });
        callback(null, PAPERS.get(paper.id)!);
    },
    getForwardReferencedPapers: function (
        _: ServerUnaryCall<Id, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        callback(null, {
            papers: Array.from(PAPERS.values()),
        });
    },
    getBackwardReferencedPapers: function (
        _: ServerUnaryCall<Id, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        callback(null, {
            papers: Array.from(PAPERS.values()),
        });
    },
    getPaperPdf: function (call: ServerUnaryCall<Id, Blob>, callback: sendUnaryData<Blob>): void {
        const { id } = call.request;
        if (PAPER_PDFS.has(id)) {
            callback(null, {
                data: PAPER_PDFS.get(id)!,
            });
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
        }
    },
    setPaperPdf: function (
        call: ServerUnaryCall<Paper_PdfUpdate, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { paperId, pdf } = call.request;
        if (PAPER_PDFS.has(paperId)) {
            PAPER_PDFS.set(paperId, pdf?.data ?? new Uint8Array());
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
        }
    },
};
