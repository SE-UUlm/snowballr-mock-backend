import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js";
import { AvailableFetcherApis } from "./grpc-gen/main";
import { ISnowballR } from "./grpc-gen/main.grpc-server";
import { Nothing, Id, BoolValue, Blob } from "./grpc-gen/base";
import {
    AuthenticationStatus,
    AuthenticationStatusResponse,
    LoginRequest,
    PasswordChangeRequest,
    PasswordResetRequest,
    RegisterRequest,
    RequestPasswordResetRequest,
} from "./grpc-gen/authentication";
import { User, User_List, User_Update, UserRole, UserStatus } from "./grpc-gen/user";
import {
    MemberRole,
    PaperDecision,
    Project,
    Project_Create,
    Project_Information,
    Project_Information_DecisionStatistics,
    Project_Information_DecisionStatistics_Get,
    Project_Information_Get,
    Project_List,
    Project_Member_Invite,
    Project_Member_List,
    Project_Member_Remove,
    Project_Member_Update,
    Project_Paper,
    Project_Paper_Add,
    Project_Paper_Get,
    Project_Paper_List,
    Project_Paper_Update,
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
    AVAILABLE_FETCHERS,
    CRITERIA,
    INVITATIONS,
    MEMBERS,
    PAPER_PDFS,
    PAPER_REVIEWS,
    PAPERS,
    PROJECT_CRITERIA,
    PROJECT_INFORMATION,
    PROJECT_PAPERS,
    PROJECT_PROJECT_PAPERS,
    PROJECTS,
    READING_LISTS,
    REVIEWS,
    USER_SETTINGS,
    USERS,
} from "./model";
import {
    addProjectPaperReviews,
    anythingUndefined,
    findFirst,
    getAuthenticated,
    getNextId,
    isEmpty,
    toUser,
} from "./util";
import { randomToken } from "./random";
import { applyFieldMask } from "protobuf-fieldmask";
import { Timestamp } from "./grpc-gen/google/protobuf/timestamp";

export const snowballRService: ISnowballR = {
    getAvailableFetcherApis: function (
        _: ServerUnaryCall<Nothing, AvailableFetcherApis>,
        callback: sendUnaryData<AvailableFetcherApis>,
    ): void {
        callback(null, { fetcherApis: AVAILABLE_FETCHERS });
    },
    register: function (
        call: ServerUnaryCall<RegisterRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
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
        call: ServerUnaryCall<LoginRequest, Nothing>,
        callback: sendUnaryData<Nothing>,
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
    renewSession: function (
        call: ServerUnaryCall<Nothing, Nothing>,
        callback: sendUnaryData<Nothing>,
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

        if (user.password != oldPassword) {
            callback({
                code: status.UNAUTHENTICATED,
                details: "The old password is incorrect",
            });
            return;
        }
        USERS.get(user.email)!.password = newPassword;
        callback(null, {});
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
            return;
        }
        callback(null, toUser(user));
    },
    getUserByEmail: function (
        call: ServerUnaryCall<Id, User>,
        callback: sendUnaryData<User>,
    ): void {
        const email = call.request.id;
        if (!USERS.has(email)) {
            callback({
                code: status.NOT_FOUND,
                details: "User with given email was not found",
            });
            return;
        }
        callback(null, toUser(USERS.get(email)!));
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
                details: "User with given id was not found",
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
                details: "User with given id was not found",
            });
            return;
        }

        USERS.get(id)!.status = UserStatus.ACTIVE;
        callback(null, {});
    },
    getAllPapersToReview: function (
        call: ServerUnaryCall<Nothing, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        const { id: userId } = getAuthenticated(call.metadata)!;
        callback(null, {
            projectPapers: Array.from(PROJECT_PAPERS.values())
                .map(addProjectPaperReviews)
                .filter(
                    (pp) =>
                        (pp.decision == PaperDecision.UNREVIEWED ||
                        pp.decision == PaperDecision.IN_REVIEW) &&
                    pp.reviews.every(r => r.userId != userId),
                ),
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
                details: "Project with given id was not found",
            });
            return;
        }

        callback(null, {
            projectPapers: (PROJECT_PROJECT_PAPERS.get(id) ?? [])
                .map((ppp) => PROJECT_PAPERS.get(ppp)!)
                .filter(
                    (pp) =>
                        pp.decision == PaperDecision.UNREVIEWED ||
                        pp.decision == PaperDecision.IN_REVIEW,
                )
                .map(addProjectPaperReviews),
        });
    },
    getUserSettings: function (
        call: ServerUnaryCall<Nothing, UserSettings>,
        callback: sendUnaryData<UserSettings>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        callback(null, USER_SETTINGS.get(user.id));
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
        callback(null, USER_SETTINGS.get(user.id));
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
        if (paper === undefined) {
            callback({
                code: status.NOT_FOUND,
                details: "The paper with the given id does not exist",
            });
        }
        READING_LISTS.get(user.id)!.push(paper!);
        callback(null, {});
    },
    removePaperFromReadingList: function (
        call: ServerUnaryCall<Id, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const user = getAuthenticated(call.metadata)!;
        const { id } = call.request;
        if (!READING_LISTS.get(user.id)?.some((p) => p.id == id)) {
            callback({
                code: status.NOT_FOUND,
                details: "The paper with the given id was not found in reading list",
            });
            return;
        }
        READING_LISTS.set(
            user.id,
            READING_LISTS.get(user.id)!.filter((p) => p.id != id),
        );
        callback(null, {});
    },
    getPendingInvitationsForUser: function (
        call: ServerUnaryCall<Id, Project_List>,
        callback: sendUnaryData<Project_List>,
    ): void {
        const { id } = call.request;
        if (!USERS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "User with given id was not found",
            });
            return;
        }

        const invitationsOfUser = INVITATIONS.get(id) ?? [];

        callback(null, {
            projects: invitationsOfUser
                .map((projectId) => PROJECTS.get(projectId))
                .filter((project) => project !== undefined),
        });
    },
    inviteUserToProject: function (
        call: ServerUnaryCall<Project_Member_Invite, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { projectId, userEmail } = call.request;

        INVITATIONS.set(userEmail, [...(INVITATIONS.get(userEmail) ?? []), projectId]);
        callback(null, {});
    },
    getPendingInvitationsForProject: function (
        call: ServerUnaryCall<Id, User_List>,
        callback: sendUnaryData<User_List>,
    ): void {
        const { id } = call.request;
        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with given id was not found",
            });
            return;
        }

        const userIdsInvitedInThisProject: string[] = [];
        for (const [user, projects] of INVITATIONS) {
            if (projects.includes(id)) {
                userIdsInvitedInThisProject.push(user);
            }
        }

        const invitedUsers = userIdsInvitedInThisProject.map((userId) => {
            const existingUser = USERS.get(userId);
            if (existingUser) {
                return existingUser;
            } else {
                const newUser: User = User.create({
                    id: userId,
                    email: userId,
                    firstName: userId,
                });
                return newUser;
            }
        });

        callback(null, {
            users: invitedUsers,
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
                details: "Project with the given id was not found",
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
                details: "Project with the given id was not found",
            });
            return;
        }

        if (!MEMBERS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "No members found for this project",
            });
            return;
        }

        // First, check whether user is a member of the given project
        const projectMembers = MEMBERS.get(projectId)!;
        if (projectMembers.some((member) => member.user?.id == userId)) {
            MEMBERS.set(
                projectId,
                MEMBERS.get(projectId)!.filter((p) => p.user?.id != userId),
            );
            callback(null, {});
            return;
        }

        // If not, check whether user is invited to this project
        const invitations = INVITATIONS.get(userId) ?? [];
        if (invitations.includes(projectId)) {
            INVITATIONS.set(
                userId,
                invitations.filter((p) => p != projectId),
            );
            callback(null, {});
            return;
        }

        callback({
            code: status.NOT_FOUND,
            details: "User is neither a project member nor invited to this project",
        });
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
        const id = getNextId(PROJECTS);
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
        PROJECT_INFORMATION.set(id, {
            projectProgress: 0,
            creationDate: Timestamp.now(),
            lastStageStarted: Timestamp.now(),
        });
        PROJECT_CRITERIA.set(id, []);
        PROJECT_PROJECT_PAPERS.set(id, []);

        for (const criterion of USER_SETTINGS.get(user.id)?.defaultCriteria?.criteria || []) {
            const criterionId = getNextId(CRITERIA);
            CRITERIA.set(criterionId, {
                ...criterion,
                id: criterionId,
            });

            PROJECT_CRITERIA.get(id)!.push(criterionId);
        }

        callback(null, PROJECTS.get(id));
    },
    getProjectById: function (
        call: ServerUnaryCall<Id, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { id } = call.request;
        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }

        callback(null, PROJECTS.get(id));
    },
    updateProject: function (
        call: ServerUnaryCall<Project_Update, Project>,
        callback: sendUnaryData<Project>,
    ): void {
        const { project, mask } = call.request;

        if (project?.id == undefined || !PROJECTS.has(project.id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
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
        callback(null, PROJECTS.get(project.id));
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
                details: "Project with the given id was not found",
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
                details: "Project with the given id was not found",
            });
            return;
        }

        PROJECTS.get(id)!.status = ProjectStatus.ACTIVE;
        callback(null, {});
    },
    getCriterionById: function (
        call: ServerUnaryCall<Id, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { id } = call.request;
        if (!CRITERIA.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Criterion with the given id was not found",
            });
            return;
        }
        callback(null, CRITERIA.get(id));
    },
    getAllCriteriaForProject: function (
        call: ServerUnaryCall<Id, Criterion_List>,
        callback: sendUnaryData<Criterion_List>,
    ): void {
        const { id } = call.request;
        if (!PROJECT_CRITERIA.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }
        callback(null, {
            criteria: PROJECT_CRITERIA.get(id)!.map((id) => CRITERIA.get(id)!),
        });
    },
    createCriterion: function (
        call: ServerUnaryCall<Criterion_Create, Criterion>,
        callback: sendUnaryData<Criterion>,
    ): void {
        const { category, description, projectId, tag, name } = call.request;
        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }

        const id = getNextId(CRITERIA);
        CRITERIA.set(id, {
            id: id,
            tag: tag,
            name: name,
            description: description,
            category: category,
        });

        PROJECT_CRITERIA.get(projectId)!.push(id);
        callback(null, CRITERIA.get(id));
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
                details: "Criterion with the given id was not found",
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
        CRITERIA.delete(id);
        callback(null, {});
    },
    getProjectPaperById: function (
        call: ServerUnaryCall<Id, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { id } = call.request;
        if (!PROJECT_PAPERS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project paper with the given id was not found",
            });
            return;
        }
        callback(null, addProjectPaperReviews(PROJECT_PAPERS.get(id)!));
    },
    getAllProjectPapersForProject: function (
        call: ServerUnaryCall<Id, Project_Paper_List>,
        callback: sendUnaryData<Project_Paper_List>,
    ): void {
        const { id } = call.request;
        if (!PROJECTS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }
        callback(null, {
            projectPapers: PROJECT_PROJECT_PAPERS.get(id)!
                .map((ppp) => PROJECT_PAPERS.get(ppp)!)
                .map(addProjectPaperReviews),
        });
    },
    addPaperToProject: function (
        call: ServerUnaryCall<Project_Paper_Add, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { projectId, paperId, stage } = call.request;
        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }
        const id = getNextId(PROJECT_PAPERS);
        const project_paper: Project_Paper = {
            id: id,
            localId: PROJECT_PROJECT_PAPERS.get(projectId)!.length.toString(),
            stage: stage,
            decision: PaperDecision.UNREVIEWED,
            reviews: [],
            paper: PAPERS.get(paperId)!,
        };
        PROJECT_PAPERS.set(id, project_paper);
        PAPER_REVIEWS.set(id, []);
        PROJECT_PROJECT_PAPERS.get(projectId)!.push(id);
        PROJECT_INFORMATION.set(projectId, {
            ...PROJECT_INFORMATION.get(projectId)!,
            projectProgress: Math.min(
                (PROJECT_INFORMATION.get(projectId)!.projectProgress ?? 0) + 0.05,
                1.0,
            ),
        });
        callback(null, project_paper);
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
                details: "Project paper with the given id was not found",
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
        if (!REVIEWS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Review with the given id was not found",
            });
            return;
        }
        callback(null, REVIEWS.get(id));
    },
    getAllReviewsForProjectPaper: function (
        call: ServerUnaryCall<Id, Review_List>,
        callback: sendUnaryData<Review_List>,
    ): void {
        const { id } = call.request;
        if (!PAPER_REVIEWS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Review with the given id was not found",
            });
            return;
        }
        callback(null, {
            reviews: PAPER_REVIEWS.get(id)!.map((id) => REVIEWS.get(id)!),
        });
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
                details: "Project paper with the given id was not found",
            });
            return;
        }

        const id = getNextId(REVIEWS);
        REVIEWS.set(id, {
            id: id,
            userId: user.id,
            decision: decision,
            selectedCriteriaIds: selectedCriteriaIds,
        });

        PAPER_REVIEWS.get(projectPaperId)!.push(id);
        callback(null, REVIEWS.get(id));
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
                details: "Review with the given id was not found",
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
        callback(null, REVIEWS.get(review.id));
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
        REVIEWS.delete(id);
        callback(null, {});
    },
    getPaperById: function (
        call: ServerUnaryCall<Id, Paper>,
        callback: sendUnaryData<Paper>,
    ): void {
        const { id } = call.request;
        if (!PAPERS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Paper with the given id was not found",
            });
            return;
        }
        callback(null, PAPERS.get(id));
    },
    createPaper: function (
        call: ServerUnaryCall<Paper, Paper>,
        callback: sendUnaryData<Paper>,
    ): void {
        const create = call.request;
        const id = getNextId(PAPERS);
        PAPERS.set(id, {
            ...create,
            id: id,
        });
        PAPER_PDFS.set(id, new Uint8Array());
        callback(null, PAPERS.get(id));
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
                details: "Paper with the given id was not found",
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
        callback(null, PAPERS.get(paper.id));
    },
    /// TODO: replace the following two calls with better implementations
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
        if (!PAPER_PDFS.has(id)) {
            callback({
                code: status.NOT_FOUND,
                details: "Paper with the given id was not found",
            });
            return;
        }
        callback(null, {
            data: PAPER_PDFS.get(id)!,
        });
    },
    setPaperPdf: function (
        call: ServerUnaryCall<Paper_PdfUpdate, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { paperId, pdf } = call.request;
        if (!PAPER_PDFS.has(paperId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Paper with the given id was not found",
            });
            return;
        }
        PAPER_PDFS.set(paperId, pdf?.data ?? new Uint8Array());
    },
    getProjectInformation: function (
        call: ServerUnaryCall<Project_Information_Get, Project_Information>,
        callback: sendUnaryData<Project_Information>,
    ): void {
        const { projectId } = call.request;

        if (!PROJECT_INFORMATION.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }

        callback(null, PROJECT_INFORMATION.get(projectId)!);
    },
    getDecisionStatisticsForStage: function (
        call: ServerUnaryCall<
            Project_Information_DecisionStatistics_Get,
            Project_Information_DecisionStatistics
        >,
        callback: sendUnaryData<Project_Information_DecisionStatistics>,
    ): void {
        const { projectId, stage } = call.request;

        if (!PROJECTS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }

        callback(null, {
            statistics: [
                PaperDecision.ACCEPTED,
                PaperDecision.DECLINED,
                PaperDecision.IN_REVIEW,
                PaperDecision.UNREVIEWED,
            ].map((decision) => {
                return {
                    decision,
                    count: BigInt(PROJECT_PROJECT_PAPERS
                        .get(projectId)!
                        .map(pp => PROJECT_PAPERS.get(pp)!)
                        .filter(pp => pp.decision == decision && pp.stage == stage)
                        .length),
                };
            }),
        });
    },
    updateProjectMemberRole: function (
        call: ServerUnaryCall<Project_Member_Update, Nothing>,
        callback: sendUnaryData<Nothing>,
    ): void {
        const { projectId, newRole, userId } = call.request;

        if (!MEMBERS.has(projectId)) {
            callback({
                code: status.NOT_FOUND,
                details: "Project with the given id was not found",
            });
            return;
        }

        const members = MEMBERS.get(projectId)!;
        const member = members.find((m) => m.user!.id === userId);

        if (member === undefined) {
            callback({
                code: status.NOT_FOUND,
                details: "User with the given id was not found in the provided Project",
            });
            return;
        }

        const newMembers = members.filter((m) => m.user!.id !== userId);
        newMembers.push({
            ...member,
            role: newRole,
        });

        MEMBERS.set(projectId, newMembers);
        callback(null, {});
    },
    getProjectPaperByRelativeId: function (
        call: ServerUnaryCall<Project_Paper_Get, Project_Paper>,
        callback: sendUnaryData<Project_Paper>,
    ): void {
        const { projectId, relativeProjectPaperId } = call.request;

        const projectPapers = PROJECT_PROJECT_PAPERS.get(projectId)
            ?.map((ppid) => PROJECT_PAPERS.get(ppid))
            .find((pp) => pp !== undefined && pp.localId === relativeProjectPaperId);

        if (projectPapers == undefined) {
            callback({
                code: status.NOT_FOUND,
                details:
                    "Project Paper with the given local id was not found in the provided project",
            });
            return;
        }

        callback(null, addProjectPaperReviews(projectPapers));
    },
    getAuthenticationStatus: function (
        call: ServerUnaryCall<Nothing, AuthenticationStatusResponse>,
        callback: sendUnaryData<AuthenticationStatusResponse>,
    ): void {
        const user = getAuthenticated(call.metadata);

        if (user === null) {
            callback(null, {
                authenticationStatus: AuthenticationStatus.UNAUTHENTICATED,
            });
        } else {
            callback(null, {
                authenticationStatus: AuthenticationStatus.AUTHENTICATED,
            });
        }
    },
};
