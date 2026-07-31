import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { type Pack, type PackMember } from "../types/Pack.js";
import { packHelpers } from "../db/packHelpers.js";
import { type UserInfo } from "../types/User.js";
import express from "express";
import session from "express-session";
import packRoutes from "../routes/packRoutes.js";

const testApp = express();
const OWNER_ID = 7;
testApp.use(express.json());

testApp.use(
  session({
    secret: "test-secret",
    resave: false,
    saveUninitialized: false,
  })
);

testApp.use((req, _res, next) => {
  req.session.userId = OWNER_ID;
  next();
});

testApp.use("/api", packRoutes);

const mockPacks: Pack[] = [
    {
      pack_id: 1,
      owner_id: 21,
      group_name: "Late Night Grinders",
      semester: "Fall",
      year: 2026,
    },
    {
      pack_id: 2,
      owner_id: 18,
      group_name: "Math Survivors",
      semester: "Spring",
      year: 2027,
    },
    {
      pack_id: 3,
      owner_id: 12,
      group_name: "CMPT 372 Squad",
      semester: "Summer",
      year: 2026,
    },
];

  const mockPack: Pack = {
    pack_id: 42,
    owner_id: 7,
    group_name: "Late Night Grinders",
    semester: "Fall",
    year: 2026,
};
const mockOwner: UserInfo = {
    user_id: OWNER_ID,
    username: "owner",
    contact_info: "owner@example.com",
    campus_schedule: "0".repeat(336),
    created_at: new Date()
}

const mockMembers: UserInfo[] = [
    {
        user_id: 8,
        username: "member",
        contact_info: "member@example.com",
        campus_schedule: "0".repeat(336),
        created_at: new Date()
    }
];

vi.mock('../db/packHelpers.js', () => ({
    packHelpers: {
        getPackById: vi.fn(),
        getPacks: vi.fn(),
        getPackMembers: vi.fn(),
        createPack: vi.fn(),
        deletePack: vi.fn(),
        editPack: vi.fn(),
        getPackMembersUserInfo: vi.fn(),
        getPackOwnersInfo: vi.fn()
    }
}));

const mockPackMembers: PackMember[] = [
    {
        pack_id: 42,
        user_id: 8,
    },
    {
        pack_id: 42,
        user_id: 12,
    },
    {
        pack_id: 42,
        user_id: 19,
    },
];

describe("Pack routes", () => {
    beforeEach(()=>{
        vi.clearAllMocks();
    });

    
    describe("GET /api/packs/get-pack-data/:owner_id/:pack_id", () => {

        it("returns 400 status code when pack_id is invalid", async() => {
            const response = await request(testApp).get(
                "/api/packs/get-pack-data/7/0"
            );
            expect(response.status).toBe(400);
            expect(packHelpers.getPackById).not.toHaveBeenCalled();
            expect(packHelpers.getPackOwnersInfo).not.toHaveBeenCalled();
            expect(packHelpers.getPackMembersUserInfo).not.toHaveBeenCalled();
        });
        
        it("Returns pack data when inputs are valid", async() => {
            

            vi.mocked(packHelpers.getPackById).mockResolvedValue(mockPack);
            vi.mocked(packHelpers.getPackOwnersInfo).mockResolvedValue(mockOwner);
            vi.mocked(packHelpers.getPackMembersUserInfo).mockResolvedValue(mockMembers);
            const response = await request(testApp).get(
                "/api/packs/get-pack-data/7/42"
            );
            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                pack_data: [
                    {
                        ...mockOwner,
                        created_at: mockOwner.created_at.toISOString()
                    }, 
                    ...mockMembers.map((member)=> ({
                        ...member,
                        created_at: member.created_at.toISOString()
                    }))]
            });

            expect(packHelpers.getPackById).toHaveBeenCalledWith(42);
            expect(packHelpers.getPackOwnersInfo).toHaveBeenCalledWith(OWNER_ID);
            expect(packHelpers.getPackMembersUserInfo).toHaveBeenCalledWith(42);

            
        });
    });

    describe("GET /api/packs/get-packs/:owner_id", () => {
        it("returns packs when inputs are valid", async() => {
            vi.mocked(packHelpers.getPacks).mockResolvedValue(mockPacks);

            const response = await request(testApp).get(
                "/api/packs/get-packs/2"
            );

            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                packs: mockPacks
            });

            expect(packHelpers.getPacks).toHaveBeenCalledWith(OWNER_ID);
        });
    });



    describe("GET /api/packs/get-pack-members/:pack_id", () => {
        it("returns 400 status code when pack_id is invalid", async() => {
            const response = await request(testApp).get(
                "/api/packs/get-pack-members/0"
            );
            expect(response.status).toBe(400);
            expect(packHelpers.getPackMembers).not.toHaveBeenCalled();
        });

        it("returns pack members when inputs are valid", async() => {
            vi.mocked(packHelpers.getPackMembers).mockResolvedValue(mockPackMembers);

            const response = await request(testApp).get(
                "/api/packs/get-pack-members/2"
            );

            expect(response.status).toBe(200);

            expect(response.body).toEqual({
                members: mockPackMembers
            });

            expect(packHelpers.getPackMembers).toHaveBeenCalledWith(2);
        });
    });


    describe("POST /api/packs/create-pack", () => {
        it("returns 400 status code when new_pack is invalid", async() => {
            const mock_friends : number[] = [3, 4, 9];
            const mock_pack : Pack = {
                pack_id: 5,
                owner_id: OWNER_ID,
                group_name: "",
                semester: "Fall",
                year: 2026,
            };
            const response = await request(testApp).post(
                "/api/packs/create-pack"
            ).send({
                new_pack: mock_pack,
                friends: mock_friends
            });
            expect(response.status).toBe(400);
            expect(packHelpers.createPack).not.toHaveBeenCalled();
        });


        it("returns a newly created pack when inputs are valid", async() => {
            const mock_pack: Pack = {
                pack_id: 5,
                owner_id: 7,
                group_name: "Late Night Grinders",
                semester: "Fall",
                year: 2026,
            };
            const mock_friends : number[] = [3, 4, 9];
            vi.mocked(packHelpers.createPack).mockResolvedValue(mockPack);

            const response = await request(testApp).post(
                "/api/packs/create-pack"
            ).send({
                new_pack: mock_pack,
                friends: mock_friends
            });

            expect(response.status).toBe(201);

            expect(response.body).toEqual({
                pack: mockPack
            });

            expect(packHelpers.createPack).toHaveBeenCalled();
        });
    });

    describe("DELETE /api/packs/delete-pack", () => {
        it("returns 400 status code when pack_id is invalid", async() => {
            const response = await request(testApp).delete(
                "/api/packs/delete-pack"
            ).send({pack_id: -1});
            expect(response.status).toBe(400);
            expect(packHelpers.deletePack).not.toHaveBeenCalled();
        });

        it("calls deletePack when inputs are valid", async() => {
            vi.mocked(packHelpers.deletePack).mockResolvedValue();
            const response = await request(testApp).delete(
                "/api/packs/delete-pack"
            ).send({pack_id: 2});

            expect(response.status).toBe(200);  

            expect(packHelpers.deletePack).toHaveBeenCalledWith(2);
        });
    });


    describe("PATCH /api/packs/edit-pack", () => {
        
        it("returns 400 status code when pack_id is invalid", async() => {
            const mock_pack : Pack = {
                ...mockPack,
                pack_id: -1
            }
            const response = await request(testApp).patch(
                "/api/packs/edit-pack"
            ).send({edited_pack: mock_pack});
            expect(response.status).toBe(400);
            expect(packHelpers.editPack).not.toHaveBeenCalled();
        });

        it("returns an updated pack when inputs are valid", async() => {
            vi.mocked(packHelpers.editPack).mockResolvedValue(mockPack);
            const response = await request(testApp).patch(
                "/api/packs/edit-pack"
            ).send({edited_pack: mockPack});

            expect(response.status).toBe(200);  
            expect(response.body).toEqual({
                updated_pack: mockPack
            });
            expect(packHelpers.editPack).toHaveBeenCalledWith(mockPack);

        });
    });


    
})