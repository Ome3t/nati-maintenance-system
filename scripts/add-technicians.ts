import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const technicians = [
  { name: "Dawit Solomon", email: "dawit@nati.com", phone: "+251 911 234 501" },
  { name: "Sara Hailu", email: "sara@nati.com", phone: "+251 911 234 502" },
  { name: "Yonas Bekele", email: "yonas@nati.com", phone: "+251 911 234 503" },
  { name: "Hanna Girma", email: "hanna@nati.com", phone: "+251 911 234 504" },
  { name: "Abel Tesfaye", email: "abel@nati.com", phone: "+251 911 234 505" },
];

async function main() {
  // Reuse an existing user's password hash so the new techs can log in
  const existing = await prisma.user.findFirst();
  if (!existing) throw new Error("No existing user found to copy the password hash from");

  for (const t of technicians) {
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: { name: t.name, phone: t.phone, role: "TECHNICIAN", isActive: true },
      create: {
        name: t.name,
        email: t.email,
        phone: t.phone,
        password: existing.password,
        role: "TECHNICIAN",
        isActive: true,
      },
    });
    console.log(`✅ ${user.name} (${user.email}) is ready`);
  }
}

main().finally(() => prisma.$disconnect());