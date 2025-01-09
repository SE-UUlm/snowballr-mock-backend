import { ServerUnaryCall, sendUnaryData } from "@grpc/grpc-js"
import { AvailableFetcherApis } from "./grpc-gen/main"
import { ISnowballR } from "./grpc-gen/main.grpc-server"
import { Nothing, Id, BoolValue, Blob } from "./grpc-gen/base"
import { LoginRequest, LoginSecret, PasswordChangeRequest, PasswordResetRequest, RegisterRequest, RenewRequest, RequestPasswordResetRequest } from "./grpc-gen/authentication"
import { User, User_List, User_Update, UserRole, UserStatus } from "./grpc-gen/user"
import { Project, Project_Create, Project_List, Project_Member_Invite, Project_Member_List, Project_Member_Remove, Project_Paper, Project_Paper_Add, Project_Paper_List, Project_Paper_Update, Project_Statistics, Project_Statistics_Get, Project_Update } from "./grpc-gen/project"
import { UserSettings, UserSettings_Update } from "./grpc-gen/user_settings"
import { Paper, Paper_List, Paper_PdfUpdate, Paper_Update } from "./grpc-gen/paper"
import { ExportRequest } from "./grpc-gen/export"
import { Criterion, Criterion_Create, Criterion_List, Criterion_Update } from "./grpc-gen/criterion"
import { Review, Review_Create, Review_List, Review_Update } from "./grpc-gen/review"
import { status } from "@grpc/grpc-js";
import { availableFetchers, users } from "./model"
import { getAuthenticated, isEmpty, randomToken } from "./util"

export const snowballRService: ISnowballR = {
    getAvailableFetcherApis: function(_: ServerUnaryCall<Nothing, AvailableFetcherApis>, callback: sendUnaryData<AvailableFetcherApis>): void {
        callback(null, { fetcherApis: availableFetchers })
    },
    register: function(call: ServerUnaryCall<RegisterRequest, LoginSecret>, callback: sendUnaryData<LoginSecret>): void {
        const { lastName, firstName, password, email } = call.request
        if (users.has(email)) {
            callback({ code: status.ALREADY_EXISTS })
            return
        }
        if ([lastName, firstName, password, email].some(isEmpty)) {
            callback({ code: status.INVALID_ARGUMENT })
            return
        }

        const accessToken = randomToken()
        const refreshToken = randomToken()

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
        })

        callback(null, {
            accessToken,
            refreshToken,
        })
    },
    login: function(call: ServerUnaryCall<LoginRequest, LoginSecret>, callback: sendUnaryData<LoginSecret>): void {
        const { email, password } =  call.request
        if (!users.has(email) || users.get(email)?.password != password) {
            callback({ code: status.PERMISSION_DENIED })
            return
        }

        const { accessToken, refreshToken } = users.get(email)!

        callback(null, {
            accessToken,
            refreshToken,
        })
    },
    logout: function(call: ServerUnaryCall<Nothing, Nothing>, callback: sendUnaryData<Nothing>): void {
        const user = getAuthenticated(call.metadata)!
        users.set(user.email, {
            ...user,
            accessToken: "",
            refreshToken: "",
        })
        callback(null);
    },
    isAuthenticated: function(call: ServerUnaryCall<Nothing, BoolValue>, callback: sendUnaryData<BoolValue>): void {
        throw new Error("Function not implemented.")
    },
    renewSession: function(call: ServerUnaryCall<RenewRequest, LoginSecret>, callback: sendUnaryData<LoginSecret>): void {
        throw new Error("Function not implemented.")
    },
    requestPasswordReset: function(call: ServerUnaryCall<RequestPasswordResetRequest, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    resetPassword: function(call: ServerUnaryCall<PasswordResetRequest, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    changePassword: function(call: ServerUnaryCall<PasswordChangeRequest, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getAllUsers: function(call: ServerUnaryCall<Nothing, User_List>, callback: sendUnaryData<User_List>): void {
        throw new Error("Function not implemented.")
    },
    getCurrentUser: function(call: ServerUnaryCall<Nothing, User>, callback: sendUnaryData<User>): void {
        throw new Error("Function not implemented.")
    },
    getUserById: function(call: ServerUnaryCall<Id, User>, callback: sendUnaryData<User>): void {
        throw new Error("Function not implemented.")
    },
    getUserByEmail: function(call: ServerUnaryCall<Id, User>, callback: sendUnaryData<User>): void {
        throw new Error("Function not implemented.")
    },
    updateUser: function(call: ServerUnaryCall<User_Update, User>, callback: sendUnaryData<User>): void {
        throw new Error("Function not implemented.")
    },
    softDeleteUser: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    softUndeleteUser: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getAllPapersToReview: function(call: ServerUnaryCall<Nothing, Project_Paper_List>, callback: sendUnaryData<Project_Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    getPapersToReviewForProject: function(call: ServerUnaryCall<Id, Project_Paper_List>, callback: sendUnaryData<Project_Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    getUserSettings: function(call: ServerUnaryCall<Nothing, UserSettings>, callback: sendUnaryData<UserSettings>): void {
        throw new Error("Function not implemented.")
    },
    updateUserSettings: function(call: ServerUnaryCall<UserSettings_Update, UserSettings>, callback: sendUnaryData<UserSettings>): void {
        throw new Error("Function not implemented.")
    },
    getReadingList: function(call: ServerUnaryCall<Nothing, Paper_List>, callback: sendUnaryData<Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    isPaperOnReadingList: function(call: ServerUnaryCall<Id, BoolValue>, callback: sendUnaryData<BoolValue>): void {
        throw new Error("Function not implemented.")
    },
    addPaperToReadingList: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    removePaperFromReadingList: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getPendingInvitationsForUser: function(call: ServerUnaryCall<Id, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    inviteUserToProject: function(call: ServerUnaryCall<Project_Member_Invite, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getPendingInvitationsForProject: function(call: ServerUnaryCall<Id, User_List>, callback: sendUnaryData<User_List>): void {
        throw new Error("Function not implemented.")
    },
    getProjectMembers: function(call: ServerUnaryCall<Id, Project_Member_List>, callback: sendUnaryData<Project_Member_List>): void {
        throw new Error("Function not implemented.")
    },
    removeProjectMember: function(call: ServerUnaryCall<Project_Member_Remove, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getAllProjects: function(call: ServerUnaryCall<Nothing, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    getAllDeletedProjects: function(call: ServerUnaryCall<Nothing, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    getAllDeletedProjectsForUser: function(call: ServerUnaryCall<Id, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    getAllArchivedProjects: function(call: ServerUnaryCall<Nothing, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    getAllProjectsForUser: function(call: ServerUnaryCall<Id, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    getAllArchivedProjectsForUser: function(call: ServerUnaryCall<Id, Project_List>, callback: sendUnaryData<Project_List>): void {
        throw new Error("Function not implemented.")
    },
    createProject: function(call: ServerUnaryCall<Project_Create, Project>, callback: sendUnaryData<Project>): void {
        throw new Error("Function not implemented.")
    },
    getProjectById: function(call: ServerUnaryCall<Id, Project>, callback: sendUnaryData<Project>): void {
        throw new Error("Function not implemented.")
    },
    updateProject: function(call: ServerUnaryCall<Project_Update, Project>, callback: sendUnaryData<Project>): void {
        throw new Error("Function not implemented.")
    },
    exportProject: function(call: ServerUnaryCall<ExportRequest, Blob>, callback: sendUnaryData<Blob>): void {
        throw new Error("Function not implemented.")
    },
    softDeleteProject: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    softUndeleteProject: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getProjectStatistics: function(call: ServerUnaryCall<Project_Statistics_Get, Project_Statistics>, callback: sendUnaryData<Project_Statistics>): void {
        throw new Error("Function not implemented.")
    },
    getCriterionById: function(call: ServerUnaryCall<Id, Criterion>, callback: sendUnaryData<Criterion>): void {
        throw new Error("Function not implemented.")
    },
    getAllCriteriaForProject: function(call: ServerUnaryCall<Id, Criterion_List>, callback: sendUnaryData<Criterion_List>): void {
        throw new Error("Function not implemented.")
    },
    createCriterion: function(call: ServerUnaryCall<Criterion_Create, Criterion>, callback: sendUnaryData<Criterion>): void {
        throw new Error("Function not implemented.")
    },
    updateCriterion: function(call: ServerUnaryCall<Criterion_Update, Criterion>, callback: sendUnaryData<Criterion>): void {
        throw new Error("Function not implemented.")
    },
    deleteCriterion: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getProjectPaperById: function(call: ServerUnaryCall<Id, Project_Paper>, callback: sendUnaryData<Project_Paper>): void {
        throw new Error("Function not implemented.")
    },
    getAllProjectPapersForProject: function(call: ServerUnaryCall<Id, Project_Paper_List>, callback: sendUnaryData<Project_Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    addPaperToProject: function(call: ServerUnaryCall<Project_Paper_Add, Project_Paper>, callback: sendUnaryData<Project_Paper>): void {
        throw new Error("Function not implemented.")
    },
    updateProjectPaper: function(call: ServerUnaryCall<Project_Paper_Update, Project_Paper>, callback: sendUnaryData<Project_Paper>): void {
        throw new Error("Function not implemented.")
    },
    removePaperFromProject: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getReviewById: function(call: ServerUnaryCall<Id, Review>, callback: sendUnaryData<Review>): void {
        throw new Error("Function not implemented.")
    },
    getAllReviewsForProjectPaper: function(call: ServerUnaryCall<Id, Review_List>, callback: sendUnaryData<Review_List>): void {
        throw new Error("Function not implemented.")
    },
    createReview: function(call: ServerUnaryCall<Review_Create, Review>, callback: sendUnaryData<Review>): void {
        throw new Error("Function not implemented.")
    },
    updateReview: function(call: ServerUnaryCall<Review_Update, Review>, callback: sendUnaryData<Review>): void {
        throw new Error("Function not implemented.")
    },
    deleteReview: function(call: ServerUnaryCall<Id, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    },
    getPaperById: function(call: ServerUnaryCall<Id, Paper>, callback: sendUnaryData<Paper>): void {
        throw new Error("Function not implemented.")
    },
    createPaper: function(call: ServerUnaryCall<Paper, Paper>, callback: sendUnaryData<Paper>): void {
        throw new Error("Function not implemented.")
    },
    updatePaper: function(call: ServerUnaryCall<Paper_Update, Paper>, callback: sendUnaryData<Paper>): void {
        throw new Error("Function not implemented.")
    },
    getForwardReferencedPapers: function(call: ServerUnaryCall<Id, Paper_List>, callback: sendUnaryData<Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    getBackwardReferencedPapers: function(call: ServerUnaryCall<Id, Paper_List>, callback: sendUnaryData<Paper_List>): void {
        throw new Error("Function not implemented.")
    },
    getPaperPdf: function(call: ServerUnaryCall<Id, Blob>, callback: sendUnaryData<Blob>): void {
        throw new Error("Function not implemented.")
    },
    setPaperPdf: function(call: ServerUnaryCall<Paper_PdfUpdate, Nothing>, callback: sendUnaryData<Nothing>): void {
        throw new Error("Function not implemented.")
    }
}
