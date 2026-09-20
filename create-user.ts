import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10)

  const result = await prisma.user.createMany({
    data: [
      { 
        name: 'Test Owner', 
        email: 'manager@nati.com', 
        password: hashedPassword, 
        role: 'OWNER' // 'OWNER' is the highest role in your schema
      },
      { 
        name: 'Test Cashier', 
        email: 'cashier@nati.com', 
        password: hashedPassword, 
        role: 'CASHIER' 
      },
      { 
        name: 'Test Technician', 
        email: 'tech@nati.com', 
        password: hashedPassword, 
        role: 'TECHNICIAN' 
      },
    ],
    skipDuplicates: true, // Prevents errors if you run this twice
  })

  console.log(`✅ Successfully created ${result.count} users!`)
  console.log('Login credentials:')
  console.log('1. manager@nati.com (Owner Dashboard)')
  console.log('2. cashier@nati.com (Cashier/Jobs Dashboard)')
  console.log('3. tech@nati.com (Technician/Jobs Dashboard)')
  console.log('Password for all: password123')
}

main()
  .catch((e) => {
    console.error(' Error creating users:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })