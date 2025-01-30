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
    availableFetchers,
    criteria,
    members,
    paper_pdfs,
    paper_reviews,
    papers,
    progress,
    project_criteria,
    project_papers,
    project_project_papers,
    projects,
    reading_lists,
    reviews,
    user_settings,
    users,
} from "./model";
import {
    anythingUndefined,
    findFirst,
    getAuthenticated,
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
        callback(null, { fetcherApis: availableFetchers });
    },
    register: function (
        call: ServerUnaryCall<RegisterRequest, LoginSecret>,
        callback: sendUnaryData<LoginSecret>,
    ): void {
        const { lastName, firstName, password, email } = call.request;
        if (users.has(email)) {
            callback({ code: status.ALREADY_EXISTS });
            return;
        }
        if ([lastName, firstName, password, email].some(isEmpty)) {
            callback({ code: status.INVALID_ARGUMENT });
            return;
        }

        const accessToken = randomToken();
        const refreshToken = randomToken();

        users.set(email, {
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
        user_settings.set(email, {
            showHotkeys: false,
            reviewMode: false,
            defaultCriteria: {
                criteria: [],
            },
            defaultProjectSettings: {
                similarityThreshold: 0.5,
                decisionMatrix: undefined,
                fetcherApis: availableFetchers,
                snowballingType: SnowballingType.BOTH,
                reviewMaybeAllowed: true,
            },
        });
        reading_lists.set(email, []);

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
        if (!users.has(email) || users.get(email)?.password != password) {
            callback({ code: status.PERMISSION_DENIED });
            return;
        }

        const { accessToken, refreshToken } = users.get(email)!;

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
        users.set(user.email, {
            ...user,
            accessToken: "",
            refreshToken: "",
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
        if (users.has(email)) {
            users.get(email)!.password = "reset";
        }
        callback(null, {});
    },
    resetPassword: function (
        _: ServerUnaryCall<PasswordResetRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        callback(null, {});
    },
    changePassword: function (
        call: ServerUnaryCall<PasswordChangeRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { oldPassword, newPassword } = call.request;
        const user = getAuthenticated(call.metadata)!;

        if (user.password == oldPassword) {
            users.get(user.email)!.password = newPassword;
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
            users: Array.from(users.values()).map(toUser),
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
        const user = findFirst(users.values(), "id", call.request.id);
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
        if (users.has(email)) {
            callback(null, toUser(users.get(email)!));
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

        if (!users.has(user.id)) {
            callback({
                code: status.NOT_FOUND,
            });
            return;
        }

        const currentUser = users.get(user.id)!;

        const update = mask == null ? user : applyFieldMask(user, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        users.set(user.id, {
            ...currentUser,
            ...update,
        });

        callback(null, users.get(user.id));
    },
    softDeleteUser: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!users.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "User not found",
            });
            return;
        }

        users.get(id)!.status = UserStatus.DELETED;
        callback(null, {});
    },
    softUndeleteUser: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!users.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "User not found",
            });
            return;
        }

        users.get(id)!.status = UserStatus.ACTIVE;
        callback(null, {});
    },
    getAllPapersToReview: function (
        _: ServerUnaryCall<Nothing, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        callback(null, {
            projectPapers: Array.from(project_papers.values()).filter(
                (pp) => pp.decision == PaperDecision.UNDECIDED,
            ),
        });
    },
    getPapersToReviewForProject: function (
        call: ServerUnaryCall<Id, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        const { id } = call.request;

        if (!projects.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        callback(null, {
            projectPapers: (project_project_papers.get(id) ?? []).map(
                (ppp) => project_papers.get(ppp)!,
            ),
        });
    },
    getUserSettings: function (
        call: ServerUnaryCall<Nothing, UserSettings>,
        callback: sendUnaryData<UserSettings>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, user_settings.get(user.id)!);
    },
    updateUserSettings: function (
        call: ServerUnaryCall<UserSettings_Update, UserSettings>,
        callback: sendUnaryData<UserSettings>,
    ): void {
        const { userSettings, mask } = call.request;
        const user = getAuthenticated(call.metadata)!;
        const currentSettings = user_settings.get(user.id)!;

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
                details: "Members must not be undefined",
            });
            return;
        }

        user_settings.set(user.id, {
            ...currentSettings,
            ...(update as UserSettings),
        });
        callback(null, user_settings.get(user.id)!);
    },
    getReadingList: function (
        call: ServerUnaryCall<Nothing, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, {
            papers: reading_lists.get(user.id)!,
        });
    },
    isPaperOnReadingList: function (
        call: ServerUnaryCall<Id, BoolValue>,
        callback: sendUnaryData<BoolValue>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        callback(null, {
            value: reading_lists.get(user.id)!.some((p) => p.id == id),
        });
    },
    addPaperToReadingList: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        const paper = papers.get(id);
        if (paper == undefined) {
            callback({
                code: status.NOT_FOUND,
                details: "The provided paper does not exist",
            });
        } else {
            reading_lists.get(user.id)!.push(paper);
            callback(null, {});
        }
    },
    removePaperFromReadingList: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        reading_lists.set(
            user.id,
            reading_lists.get(user.id)!.filter((p) => p.id != id),
        );
        callback(null, {});
    },
    getPendingInvitationsForUser: function (
        _: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: [],
        });
    },
    inviteUserToProject: function (
        _: ServerUnaryCall<Project_Member_Invite, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        callback(null, {});
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
        if (projects.has(id)) {
            callback(null, {
                members: members.get(id)!,
            });
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project does not exist",
            });
        }
    },
    removeProjectMember: function (
        call: ServerUnaryCall<Project_Member_Remove, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { projectId, userId } = call.request;
        if (members.has(projectId)) {
            members.set(
                projectId,
                members.get(projectId)!.filter((p) => p.user?.id != userId),
            );
            callback(null, {});
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
        }
    },
    getAllProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(projects.values()).filter((p) => p.status == ProjectStatus.ACTIVE),
        });
    },
    getAllDeletedProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(projects.values()).filter(
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
            projects: Array.from(projects.values()).filter(
                (p) =>
                    p.status == ProjectStatus.DELETED &&
                    members.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    getAllArchivedProjects: function (
        _: ServerUnaryCall<Nothing, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        callback(null, {
            projects: Array.from(projects.values()).filter(
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
            projects: Array.from(projects.values()).filter(
                (p) =>
                    p.status == ProjectStatus.ACTIVE &&
                    members.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    getAllArchivedProjectsForUser: function (
        call: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        const { id } = call.request;
        callback(null, {
            projects: Array.from(projects.values()).filter(
                (p) =>
                    p.status == ProjectStatus.ARCHIVED &&
                    members.get(p.id)!.some((m) => m.user?.id == id),
            ),
        });
    },
    createProject: function (
        call: ServerUnaryCall<Project_Create, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { name } = call.request;
        const id = projects.size.toString();
        projects.set(id, {
            id: id,
            name: name,
            status: ProjectStatus.ACTIVE,
            currentStage: 0n,
            maxStage: 0n,
        });
        members.set(id, [
            {
                role: MemberRole.ADMIN,
                user: user,
            },
        ]);
        progress.set(id, Math.random());
        project_criteria.set(id, []);
        project_project_papers.set(id, []);
        callback(null, projects.get(id)!);
    },
    getProjectById: function (
        call: ServerUnaryCall<Id, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { id } = call.request;
        if (projects.has(id)) {
            callback(null, projects.get(id)!);
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Project was not found",
            });
        }
    },
    updateProject: function (
        call: ServerUnaryCall<Project_Update, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { project, mask } = call.request;

        if (project?.id == undefined || !projects.has(project.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project was not found",
            });
            return;
        }

        const currentProject = projects.get(project.id)!;
        const update = mask == null ? project : applyFieldMask(project, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        projects.set(project.id, {
            ...currentProject,
            ...(update as Project),
        });
        callback(null, projects.get(project.id)!);
    },
    exportProject: function (
        _: ServerUnaryCall<ExportRequest, Blob>,
        callback: sendUnaryData<Blob>,
    ): void {
        callback(null, {
            data: new Uint8Array(),
        });
    },
    softDeleteProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!projects.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        projects.get(id)!.status = ProjectStatus.DELETED;
        callback(null, {});
    },
    softUndeleteProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;

        if (!projects.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        projects.get(id)!.status = ProjectStatus.ACTIVE;
        callback(null, {});
    },
    getProjectStatistics: function (
        call: ServerUnaryCall<Project_Statistics_Get, Project_Statistics>,
        callback: sendUnaryData<Project_Statistics>,
    ): void {
        const { projectId } = call.request;
        callback(null, {
            projectProgress: progress.get(projectId)!,
        });
    },
    getCriterionById: function (
        call: ServerUnaryCall<Id, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { id } = call.request;
        if (criteria.has(id)) {
            callback(null, criteria.get(id)!);
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
        if (project_criteria.has(id)) {
            callback(null, {
                criteria: project_criteria.get(id)!.map((id) => criteria.get(id)!),
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
        if (!projects.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project not found",
            });
            return;
        }

        const id = criteria.size.toString();
        criteria.set(id, {
            id: id,
            tag: tag,
            name: name,
            description: description,
            category: category,
        });

        project_criteria.get(projectId)!.push(id);
        callback(null, criteria.get(id)!);
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

        if (!criteria.has(criterion.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Criterion not found",
            });
            return;
        }

        const currentCriterion = criteria.get(criterion.id)!;
        const update = mask == null ? criterion : applyFieldMask(criterion, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        criteria.set(criterion.id, {
            ...currentCriterion,
            ...(update as Criterion),
        });
        callback(null, criteria.get(criterion.id));
    },
    deleteCriterion: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectId, criteria] of project_criteria) {
            project_criteria.set(
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
        if (project_papers.has(id)) {
            callback(null, project_papers.get(id)!);
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
        if (project_papers.has(id)) {
            callback(null, {
                projectPapers: project_project_papers
                    .get(id)!
                    .map((ppp) => project_papers.get(ppp)!),
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
        if (project_papers.has(projectId)) {
            const id = project_papers.size.toString();
            const project_paper: Project_Paper = {
                id: id,
                stage: stage,
                decision: PaperDecision.UNDECIDED,
                reviews: [],
                paper: papers.get(paperId)!,
            };
            project_papers.set(id, project_paper);
            paper_reviews.set(id, []);
            project_project_papers.get(projectId)!.push(id);
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

        if (!project_papers.has(projectPaper.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project paper not found",
            });
            return;
        }

        const currentProjectPaper = project_papers.get(projectPaper.id)!;
        const update = mask == null ? projectPaper : applyFieldMask(projectPaper, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        project_papers.set(projectPaper.id, {
            ...currentProjectPaper,
            ...(update as Project_Paper),
        });
        callback(null, project_papers.get(projectPaper.id)!);
    },
    removePaperFromProject: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectId, ppp] of project_project_papers) {
            project_project_papers.set(
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
        if (reviews.has(id)) {
            callback(null, reviews.get(id)!);
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
        if (paper_reviews.has(id)) {
            callback(null, {
                reviews: paper_reviews.get(id)!.map((id) => reviews.get(id)!),
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
        if (!project_papers.has(projectPaperId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project paper not found",
            });
            return;
        }

        const id = reviews.size.toString();
        reviews.set(id, {
            id: id,
            userId: user.id,
            decision: decision,
            selectedCriteriaIds: selectedCriteriaIds,
        });

        paper_reviews.get(projectPaperId)!.push(id);
        callback(null, reviews.get(id)!);
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

        if (!reviews.has(review.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Review not found",
            });
            return;
        }

        const currentReview = reviews.get(review.id)!;
        const update = mask == null ? review : applyFieldMask(review, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        reviews.set(review.id, {
            ...currentReview,
            ...(update as Review),
        });
        callback(null, reviews.get(review.id)!);
    },
    deleteReview: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { id } = call.request;
        for (const [projectPaperId, reviews] of paper_reviews) {
            paper_reviews.set(
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
        if (papers.has(id)) {
            callback(null, papers.get(id)!);
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
        const id = papers.size.toString();
        papers.set(id, {
            ...create,
            id: id,
        });
        paper_pdfs.set(id, new Uint8Array());
        callback(null, papers.get(id)!);
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

        if (!papers.has(paper.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
            return;
        }

        const currentPaper = papers.get(paper.id)!;
        const update = mask == null ? paper : applyFieldMask(paper, mask.paths);
        delete update["id"];

        if (anythingUndefined(update)) {
            callback({
                code: status.INVALID_ARGUMENT,
                details: "Members must not be undefined",
            });
            return;
        }

        papers.set(paper.id, {
            ...currentPaper,
            ...(update as Paper),
        });
        callback(null, papers.get(paper.id)!);
    },
    getForwardReferencedPapers: function (
        _: ServerUnaryCall<Id, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        callback(null, {
            papers: Array.from(papers.values()),
        });
    },
    getBackwardReferencedPapers: function (
        _: ServerUnaryCall<Id, Paper_List>,
        callback: sendUnaryData<Paper_List>,
    ): void {
        callback(null, {
            papers: Array.from(papers.values()),
        });
    },
    getPaperPdf: function (call: ServerUnaryCall<Id, Blob>, callback: sendUnaryData<Blob>): void {
        const { id } = call.request;
        if (paper_pdfs.has(id)) {
            callback(null, {
                data: paper_pdfs.get(id)!,
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
        if (paper_pdfs.has(paperId)) {
            paper_pdfs.set(paperId, pdf?.data ?? new Uint8Array());
        } else {
            callback({
                code: status.NOT_FOUND,
                details: "Paper not found",
            });
        }
    },
};
