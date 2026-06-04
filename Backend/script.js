import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  // Hash the password "123456" properly using bcryptjs
  const hashedPassword = await bcrypt.hash("123456", 10);

  const usersData = [
    {
      name: "Hussein",
      email: "hussein@gmail.com",
      password: hashedPassword,
      role: "eigenaar",
    },
    {
      name: "hussein",
      email: "h-kadhim@outlook.com",
      password: hashedPassword,
      role: "klant",
    },
    {
      name: "rra",
      email: "rra@mboutrecht.nl",
      password: hashedPassword,
      role: "instructeur",
    },
  ];

  console.log("Updating users with correct roles and password '123456'...");

  for (const data of usersData) {
    try {
      const user = await prisma.user.upsert({
        where: { email: data.email },
        update: {
          role: data.role,
          password: data.password,
        },
        create: {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
        },
      });
      console.log(`User created/updated: ${user.name} (${user.email}) -> role: ${user.role}`);
    } catch (error) {
      console.error(`Fout bij verwerken van ${data.email}:`, error);
    }
  }

  // Fetch all users
  const allUsers = await prisma.user.findMany();
  console.log("All users in database:", JSON.stringify(allUsers, null, 2));
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
