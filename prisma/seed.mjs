import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "ttpu1234";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const group = await prisma.group.upsert({
    where: { name: "AI2-26" },
    update: {},
    create: { name: "AI2-26", year: 2026 },
  });
  const group25 = await prisma.group.upsert({
    where: { name: "AI2-25" },
    update: {},
    create: { name: "AI2-25", year: 2025 },
  });

  const users = [
    { email: "admin@ttpu.uz", name: "Administrator", role: "ADMIN", groupId: null },
    { email: "n.mahamatov@ttpu.uz", name: "N. Mahamatov", role: "TEACHER", groupId: null },
    { email: "a.mamanazarov@ttpu.uz", name: "A. Mamanazarov", role: "TEACHER", groupId: null },
    { email: "o.ismoilova@ttpu.uz", name: "O. Ismoilova", role: "TEACHER", groupId: null },
    { email: "l.nazarova@ttpu.uz", name: "L. Nazarova", role: "TEACHER", groupId: null },
    { email: "o.makhmudov@ttpu.uz", name: "O. Makhmudov", role: "TEACHER", groupId: null },
    { email: "kh.khamidulla@ttpu.uz", name: "KH. Khamidulla", role: "TEACHER", groupId: null },
    { email: "ozodbek@ttpu.uz", name: "Ozodbek Hoshimov", role: "STUDENT", groupId: group.id },
    { email: "student2@ttpu.uz", name: "Aziza Karimova", role: "STUDENT", groupId: group.id },
    { email: "student3@ttpu.uz", name: "Bekzod Tursunov", role: "STUDENT", groupId: group.id },
    { email: "student4@ttpu.uz", name: "Dilnoza Yusupova", role: "STUDENT", groupId: group.id },
    { email: "student5@ttpu.uz", name: "Eldor Sattorov", role: "STUDENT", groupId: group25.id },
  ];

  const created = {};
  for (const u of users) {
    created[u.email] = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, groupId: u.groupId },
      create: { ...u, passwordHash },
    });
  }

  const courses = [
    {
      slug: "prog",
      title: "Programming Fundamentals (PROG)",
      description: "Dasturlash asoslari: algoritmlar, C/Python, amaliy mashg'ulotlar.",
      coverColor: "#2563eb",
      teacherId: created["n.mahamatov@ttpu.uz"].id,
    },
    {
      slug: "math1",
      title: "Mathematics 1 (MATH 1)",
      description: "Chiziqli algebra va matematik analiz asoslari.",
      coverColor: "#16a34a",
      teacherId: created["a.mamanazarov@ttpu.uz"].id,
    },
    {
      slug: "phy1",
      title: "Physics 1 (PHY 1)",
      description: "Mexanika va molekulyar fizika.",
      coverColor: "#dc2626",
      teacherId: created["o.ismoilova@ttpu.uz"].id,
    },
    {
      slug: "eng1",
      title: "English 1 (ENG 1)",
      description: "Academic English: reading, writing, speaking.",
      coverColor: "#9333ea",
      teacherId: created["l.nazarova@ttpu.uz"].id,
    },
  ];

  for (const c of courses) {
    const course = await prisma.course.upsert({
      where: { slug: c.slug },
      update: { title: c.title, description: c.description, teacherId: c.teacherId, isPublished: true },
      create: { ...c, isPublished: true },
    });

    const students = await prisma.user.findMany({ where: { role: "STUDENT", groupId: group.id } });
    for (const s of students) {
      await prisma.enrollment.upsert({
        where: { courseId_userId: { courseId: course.id, userId: s.id } },
        update: {},
        create: { courseId: course.id, userId: s.id },
      });
    }
  }

  const prog = await prisma.course.findUnique({ where: { slug: "prog" } });
  const math = await prisma.course.findUnique({ where: { slug: "math1" } });

  const sec1 = await prisma.section.create({
    data: { courseId: prog.id, title: "1-hafta: Kirish va muhit", position: 1 },
  });
  const sec2 = await prisma.section.create({
    data: { courseId: prog.id, title: "2-hafta: Algoritmlar", position: 2 },
  });
  const secM = await prisma.section.create({
    data: { courseId: math.id, title: "1-hafta: Matritsalar", position: 1 },
  });

  await prisma.material.createMany({
    data: [
      {
        sectionId: sec1.id,
        title: "Ma'ruza slaydlari (PDF)",
        type: "LINK",
        content: "https://example.com/prog-lecture-1.pdf",
        position: 1,
      },
      {
        sectionId: sec1.id,
        title: "Muhitni o'rnatish qo'llanmasi",
        type: "TEXT",
        content:
          "## VS Code + Python\n\n1. python.org dan Python 3.12 o'rnating\n2. VS Code'da Python extension o'rnating\n3. Birinchi `print(\"Hello, TTPU!\")` dasturingizni yozing",
        position: 2,
      },
      {
        sectionId: sec2.id,
        title: "Algoritm turlari (video)",
        type: "VIDEO",
        content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        position: 1,
      },
      {
        sectionId: secM.id,
        title: "Matritsa amallari — konspekt",
        type: "TEXT",
        content: "## Matritsalar\n\n- Qo'shish\n- Ko'paytirish\n- Determinant",
        position: 1,
      },
    ],
  });

  const assignment = await prisma.assignment.create({
    data: {
      courseId: prog.id,
      title: "Amaliy topshiriq 1: Kiritish-chiqarish",
      description: "Foydalanuvchidan ism va yoshni so'rab, ekranga chiqaruvchi dastur yozing. Faylni yuklang.",
      dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
      maxScore: 100,
    },
  });
  await prisma.assignment.create({
    data: {
      courseId: math.id,
      title: "Uy vazifasi 1: Matritsalar",
      description: "Berilgan matritsalarning ko'paytmasini hisoblang, yechimni matn ko'rinishida yuboring.",
      dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
      maxScore: 50,
    },
  });

  const ozodbek = created["ozodbek@ttpu.uz"];
  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: ozodbek.id,
      text: "Dastur kodini faylga joyladim: kirish-chiqarish misoli.",
      status: "SUBMITTED",
    },
  });

  const quiz = await prisma.quiz.create({
    data: {
      courseId: prog.id,
      title: "Test 1: Asosiy tushunchalar",
      description: "10 daqiqalik qisqa test",
      timeLimitMin: 10,
      maxAttempts: 2,
      isPublished: true,
    },
  });
  await prisma.question.createMany({
    data: [
      {
        quizId: quiz.id,
        text: "Python'da ekranga chiqarish uchun qaysi funksiya ishlatiladi?",
        type: "SINGLE",
        options: ["print()", "write()", "echo()", "output()"],
        correct: [0],
        points: 1,
        position: 1,
      },
      {
        quizId: quiz.id,
        text: "Qaysilari dasturlash tili? (bir nechta javob)",
        type: "MULTIPLE",
        options: ["Python", "HTML", "C++", "Photoshop"],
        correct: [0, 2],
        points: 2,
        position: 2,
      },
      {
        quizId: quiz.id,
        text: "Algoritm nima? Qisqacha yozing.",
        type: "TEXT",
        options: [],
        correct: ["algoritm"],
        points: 2,
        position: 3,
      },
    ],
  });

  const attendance = [];
  for (let i = 7; i >= 1; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    attendance.push({
      courseId: prog.id,
      studentId: ozodbek.id,
      date: new Date(d.toISOString().slice(0, 10)),
      status: i === 3 ? "ABSENT" : "PRESENT",
    });
  }
  await prisma.attendance.createMany({ data: attendance, skipDuplicates: true });

  const scheduleData = [
    { dayOfWeek: 1, slot: 2, subject: "ENG 1", teacher: "L.NAZAROVA", room: "304-xona" },
    { dayOfWeek: 2, slot: 2, subject: "MATH 1 (prac)", teacher: "A.MAMANAZAROV", room: "205-xona" },
    { dayOfWeek: 2, slot: 3, subject: "PHY 1 (lec)", teacher: "O.ISMOILOVA", room: "Yellow Hall" },
    { dayOfWeek: 3, slot: 2, subject: "PROG (prac)", teacher: "KH.KHAMIDULLA", room: "LAB 403" },
    { dayOfWeek: 3, slot: 3, subject: "PROG (lec)", teacher: "N.MAHAMATOV", room: "Green Hall" },
    { dayOfWeek: 4, slot: 2, subject: "MATH 1 (prac)", teacher: "A.MAMANAZAROV", room: "203-xona" },
    { dayOfWeek: 4, slot: 3, subject: "TH", teacher: "O.MAKHMUDOV", room: "Conference Hall" },
  ];

  const existingSchedule = await prisma.scheduleEntry.count({ where: { groupId: group.id } });
  if (existingSchedule === 0) {
    await prisma.scheduleEntry.createMany({
      data: scheduleData.map((s) => ({ ...s, groupId: group.id })),
    });
  }

  const all = await prisma.user.findMany({ where: { id: { not: ozodbek.id } } });
  await prisma.notification.createMany({
    data: all.slice(0, 5).map((u) => ({
      userId: u.id,
      title: "Tizim ishga tushdi",
      body: "TTPU LMS demo tizimiga xush kelibsiz!",
      link: "/dashboard",
    })),
  });

  console.log("Seed tayyor. Demo loginlar (parol: ttpu1234):");
  console.log("  admin@ttpu.uz | n.mahamatov@ttpu.uz | ozodbek@ttpu.uz");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
