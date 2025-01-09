import { LoginSecret } from "./grpc-gen/authentication"
import { User } from "./grpc-gen/user"

export type ServerUser = User & { password: string } & LoginSecret

export const availableFetchers = [ "fake", "mock" ]
export const users: Map<string, ServerUser> = new Map()
