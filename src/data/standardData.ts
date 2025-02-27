import { User, UserRole, UserStatus } from "../grpc-gen/user";
import { ExampleData } from "../model";

const users: User[] = [
    {
        id: "1",
        email: "alice.smith@example.com",
        firstName: "Alice",
        lastName: "Smith",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "2",
        email: "bob.jones@example.com",
        firstName: "Bob",
        lastName: "Jones",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "3",
        email: "charlie.davis@example.com",
        firstName: "Charlie",
        lastName: "Davis",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "4",
        email: "diana.martin@example.com",
        firstName: "Diana",
        lastName: "Martin",
        role: UserRole.DEFAULT,
        status: UserStatus.DELETED,
    },
    {
        id: "5",
        email: "edward.miller@example.com",
        firstName: "Edward",
        lastName: "Miller",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "6",
        email: "fiona.wilson@example.com",
        firstName: "Fiona",
        lastName: "Wilson",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
    {
        id: "7",
        email: "george.anderson@example.com",
        firstName: "George",
        lastName: "Anderson",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "8",
        email: "hannah.taylor@example.com",
        firstName: "Hannah",
        lastName: "Taylor",
        role: UserRole.ADMIN,
        status: UserStatus.DELETED,
    },
    {
        id: "9",
        email: "ian.thomas@example.com",
        firstName: "Ian",
        lastName: "Thomas",
        role: UserRole.DEFAULT,
        status: UserStatus.ACTIVE,
    },
    {
        id: "10",
        email: "julia.clark@example.com",
        firstName: "Julia",
        lastName: "Clark",
        role: UserRole.ADMIN,
        status: UserStatus.ACTIVE,
    },
];

export const exampleData: ExampleData = {
    users: users,
};
