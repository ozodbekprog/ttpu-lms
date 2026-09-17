import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PASSWORD = "ttpu1234";

function daysAgo(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return new Date(d.toISOString().slice(0, 10));
}

async function ensureSection(courseId, title, position) {
  const existing = await prisma.section.findFirst({ where: { courseId, title } });
  if (existing) return existing;
  return prisma.section.create({ data: { courseId, title, position } });
}

async function ensureMaterial(sectionId, title, data) {
  const existing = await prisma.material.findFirst({ where: { sectionId, title } });
  if (existing) return existing;
  return prisma.material.create({ data: { sectionId, title, ...data } });
}

async function ensureAssignment(courseId, title, data) {
  const existing = await prisma.assignment.findFirst({ where: { courseId, title } });
  if (existing) return existing;
  return prisma.assignment.create({ data: { courseId, title, ...data } });
}

async function ensureQuiz(courseId, title, data) {
  const existing = await prisma.quiz.findFirst({ where: { courseId, title } });
  if (existing) return existing;
  return prisma.quiz.create({ data: { courseId, title, ...data } });
}

async function ensureQuestions(quizId, questions) {
  const count = await prisma.question.count({ where: { quizId } });
  if (count > 0) return;
  await prisma.question.createMany({ data: questions.map((q) => ({ ...q, quizId })) });
}

async function ensureSubmission(assignmentId, studentId, data) {
  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId, studentId } },
    update: data,
    create: { assignmentId, studentId, ...data },
  });
}

async function ensureNotification(userId, title, data) {
  const existing = await prisma.notification.findFirst({ where: { userId, title } });
  if (existing) return existing;
  return prisma.notification.create({ data: { userId, title, ...data } });
}

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
  const phy = await prisma.course.findUnique({ where: { slug: "phy1" } });
  const eng = await prisma.course.findUnique({ where: { slug: "eng1" } });

  const sec1 = await ensureSection(prog.id, "1-hafta: Kirish va muhit", 1);
  const sec2 = await ensureSection(prog.id, "2-hafta: Algoritmlar", 2);
  const secM = await ensureSection(math.id, "1-hafta: Matritsalar", 1);
  const secM2 = await ensureSection(math.id, "2-hafta: Determinantlar va teskari matritsa", 2);
  const secPhy = await ensureSection(phy.id, "1-hafta: Kinematika", 1);
  const secEng = await ensureSection(eng.id, "1-hafta: Academic Writing", 1);

  const materials = [
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
    {
      sectionId: secM2.id,
      title: "Determinantlar xossalari — konspekt",
      type: "TEXT",
      content:
        "## Determinant\n\n- 2x2: `det = ad - bc`\n- Uchburchak qoidasi\n- Teskari matritsa: `A⁻¹ = adj(A) / det(A)`",
      position: 1,
    },
    {
      sectionId: secPhy.id,
      title: "Kinematika asoslari — konspekt",
      type: "TEXT",
      content:
        "## Kinematika\n\n- Tekis harakat: `s = v · t`\n- Tezlanish: `a = (v - v₀) / t`\n- Erkin tushish: `h = gt² / 2`",
      position: 1,
    },
    {
      sectionId: secPhy.id,
      title: "Formulalar jadvali",
      type: "LINK",
      content: "https://example.com/phy1-formulas.pdf",
      position: 2,
    },
    {
      sectionId: secPhy.id,
      title: "Ma'ruza yozuvi: Tekis harakat",
      type: "VIDEO",
      content: "https://www.youtube.com/watch?v=ZM8ECpBuQYE",
      position: 3,
    },
    {
      sectionId: secEng.id,
      title: "Academic essay tuzilishi",
      type: "TEXT",
      content:
        "## Essay tuzilishi\n\n1. Introduction (tezis)\n2. Body (2-3 paragraf, dalillar)\n3. Conclusion (xulosa)",
      position: 1,
    },
    {
      sectionId: secEng.id,
      title: "Academic Word List (AWL)",
      type: "LINK",
      content: "https://www.wgtn.ac.nz/lals/resources/academicwordlist",
      position: 2,
    },
    {
      sectionId: secEng.id,
      title: "Writing Task 1: video dars",
      type: "VIDEO",
      content: "https://www.youtube.com/watch?v=8UjG7bD4TXc",
      position: 3,
    },
  ];

  for (const m of materials) {
    await ensureMaterial(m.sectionId, m.title, {
      type: m.type,
      content: m.content,
      position: m.position,
    });
  }

  const assignment = await ensureAssignment(prog.id, "Amaliy topshiriq 1: Kiritish-chiqarish", {
    description: "Foydalanuvchidan ism va yoshni so'rab, ekranga chiqaruvchi dastur yozing. Faylni yuklang.",
    dueAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    maxScore: 100,
  });
  await ensureAssignment(math.id, "Uy vazifasi 1: Matritsalar", {
    description: "Berilgan matritsalarning ko'paytmasini hisoblang, yechimni matn ko'rinishida yuboring.",
    dueAt: new Date(Date.now() + 5 * 24 * 3600 * 1000),
    maxScore: 50,
  });
  const mathAssignment2 = await ensureAssignment(math.id, "Uy vazifasi 2: Determinantlar", {
    description: "2x2 va 3x3 matritsalar determinantini hisoblang, yechim qadamlarini yozing.",
    dueAt: new Date(Date.now() + 9 * 24 * 3600 * 1000),
    maxScore: 50,
  });

  const ozodbek = created["ozodbek@ttpu.uz"];
  const student2 = created["student2@ttpu.uz"];
  const student3 = created["student3@ttpu.uz"];
  const student4 = created["student4@ttpu.uz"];

  const progSubmissions = [
    {
      student: ozodbek,
      data: {
        text: "Dastur kodini faylga joyladim: kirish-chiqarish misoli.",
        status: "GRADED",
        score: 92,
        feedback: "Ajoyib! Kod toza, o'zgaruvchilar nomi tushunarli.",
        gradedAt: daysAgo(1),
      },
    },
    {
      student: student2,
      data: {
        text: "Ism va yoshni kiritib chiqaruvchi dastur tayyor.",
        status: "GRADED",
        score: 85,
        feedback: "Yaxshi bajarilgan, kiritishni validatsiya qilishni qo'shing.",
        gradedAt: daysAgo(1),
      },
    },
    {
      student: student3,
      data: {
        text: "Vazifani bajardim, fayl ilova qilindi.",
        status: "SUBMITTED",
        score: null,
        feedback: null,
        gradedAt: null,
      },
    },
    {
      student: student4,
      data: {
        text: "Dastur ishlaydi, natijani skrinshot qildim.",
        status: "SUBMITTED",
        score: null,
        feedback: null,
        gradedAt: null,
      },
    },
  ];

  for (const s of progSubmissions) {
    await ensureSubmission(assignment.id, s.student.id, s.data);
  }

  const mathSubmissions = [
    {
      student: ozodbek,
      data: {
        text: "Barcha determinantlar yechildi, qadamlar ketma-ket yozilgan.",
        status: "GRADED",
        score: 46,
        feedback: "Yechim to'g'ri, 3-misolda bitta arifmetik xatolik.",
        gradedAt: daysAgo(1),
      },
    },
    {
      student: student2,
      data: {
        text: "Determinantlarni hisobladim va teskari matritsani topdim.",
        status: "GRADED",
        score: 40,
        feedback: "Teskari matritsa qadamlarini batafsil yozing.",
        gradedAt: daysAgo(1),
      },
    },
    {
      student: student3,
      data: {
        text: "Yechimlar matn ko'rinishida yuborildi.",
        status: "SUBMITTED",
        score: null,
        feedback: null,
        gradedAt: null,
      },
    },
    {
      student: student4,
      data: {
        text: "Kech topshirganim uchun uzr, vazifa bajarildi.",
        status: "LATE",
        score: null,
        feedback: null,
        gradedAt: null,
      },
    },
  ];

  for (const s of mathSubmissions) {
    await ensureSubmission(mathAssignment2.id, s.student.id, s.data);
  }

  const quiz = await ensureQuiz(prog.id, "Test 1: Asosiy tushunchalar", {
    description: "10 daqiqalik qisqa test",
    timeLimitMin: 10,
    maxAttempts: 2,
    isPublished: true,
  });
  await ensureQuestions(quiz.id, [
    {
      text: "Python'da ekranga chiqarish uchun qaysi funksiya ishlatiladi?",
      type: "SINGLE",
      options: ["print()", "write()", "echo()", "output()"],
      correct: [0],
      points: 1,
      position: 1,
    },
    {
      text: "Qaysilari dasturlash tili? (bir nechta javob)",
      type: "MULTIPLE",
      options: ["Python", "HTML", "C++", "Photoshop"],
      correct: [0, 2],
      points: 2,
      position: 2,
    },
    {
      text: "Algoritm nima? Qisqacha yozing.",
      type: "TEXT",
      options: [],
      correct: ["algoritm"],
      points: 2,
      position: 3,
    },
  ]);

  const mathQuiz = await ensureQuiz(math.id, "Test 2: Determinantlar", {
    description: "Determinant va teskari matritsa bo'yicha test",
    timeLimitMin: 15,
    maxAttempts: 2,
    isPublished: true,
  });
  await ensureQuestions(mathQuiz.id, [
    {
      text: "2x2 matritsaning determinanti qanday hisoblanadi?",
      type: "SINGLE",
      options: ["ad - bc", "ab - cd", "a + d - b - c", "ac - bd"],
      correct: [0],
      points: 2,
      position: 1,
    },
    {
      text: "Qaysi amallar determinant qiymatini o'zgartirmaydi? (bir nechta javob)",
      type: "MULTIPLE",
      options: [
        "Satrga boshqa satrning karralisini qo'shish",
        "Ikki satrni almashtirish",
        "Satrni nolga ko'paytirish",
        "Matritsani transponirlash",
      ],
      correct: [0, 3],
      points: 2,
      position: 2,
    },
    {
      text: "3x3 determinantni hisoblash usulini qisqacha tushuntiring.",
      type: "TEXT",
      options: [],
      correct: ["uchburchak"],
      points: 2,
      position: 3,
    },
  ]);

  const existingMathAttempt = await prisma.quizAttempt.findFirst({
    where: { quizId: mathQuiz.id, studentId: ozodbek.id },
  });
  if (!existingMathAttempt) {
    const mathQuestions = await prisma.question.findMany({
      where: { quizId: mathQuiz.id },
      orderBy: { position: "asc" },
    });
    const values = [0, [0, 3], "Uchburchak qoidasi yoki satr bo'yicha yoyish orqali."];
    const answers = {};
    mathQuestions.forEach((q, index) => {
      answers[q.id] = values[index];
    });
    await prisma.quizAttempt.create({
      data: {
        quizId: mathQuiz.id,
        studentId: ozodbek.id,
        startedAt: daysAgo(1),
        finishedAt: new Date(),
        score: 4,
        answers,
      },
    });
  }

  const lessonDays = [10, 8, 6, 4, 2];
  const attendancePlan = [
    {
      student: ozodbek,
      statuses: ["PRESENT", "PRESENT", "LATE", "PRESENT", "PRESENT"],
    },
    {
      student: student2,
      statuses: ["PRESENT", "ABSENT", "PRESENT", "PRESENT", "PRESENT"],
    },
    {
      student: student3,
      statuses: ["PRESENT", "PRESENT", "PRESENT", "LATE", "PRESENT"],
    },
    {
      student: student4,
      statuses: ["ABSENT", "PRESENT", "PRESENT", "PRESENT", "PRESENT"],
    },
  ];

  const attendance = [];
  for (const plan of attendancePlan) {
    lessonDays.forEach((days, index) => {
      const status = plan.statuses[index];
      attendance.push({
        courseId: prog.id,
        studentId: plan.student.id,
        date: daysAgo(days),
        status,
        note: status === "LATE" ? "Kechikdi" : status === "ABSENT" ? "Sababsiz" : null,
      });
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
  for (const u of all.slice(0, 5)) {
    await ensureNotification(u.id, "Tizim ishga tushdi", {
      body: "TTPU LMS demo tizimiga xush kelibsiz!",
      link: "/dashboard",
    });
  }

  const notificationPlan = [
    {
      email: "ozodbek@ttpu.uz",
      title: "Yangi material",
      body: "PROG kursiga yangi video material qo'shildi: Algoritm turlari.",
      link: "/courses/prog",
      isRead: false,
    },
    {
      email: "ozodbek@ttpu.uz",
      title: "Yangi topshiriq",
      body: "MATH 1 kursida yangi topshiriq e'lon qilindi: Uy vazifasi 2.",
      link: "/courses/math1/assignments",
      isRead: false,
    },
    {
      email: "ozodbek@ttpu.uz",
      title: "Topshiriq baholandi",
      body: "PROG Amaliy topshiriq 1 baholandi: 92/100.",
      link: "/courses/prog/assignments",
      isRead: false,
    },
    {
      email: "ozodbek@ttpu.uz",
      title: "Tizim ishga tushdi",
      body: "TTPU LMS demo tizimiga xush kelibsiz!",
      link: "/dashboard",
      isRead: true,
    },
    {
      email: "student2@ttpu.uz",
      title: "Topshiriq baholandi",
      body: "PROG topshirig'ingiz baholandi: 85/100.",
      link: "/courses/prog/assignments",
      isRead: false,
    },
    {
      email: "student2@ttpu.uz",
      title: "Yangi material",
      body: "ENG 1 kursiga yangi material qo'shildi.",
      link: "/courses/eng1",
      isRead: true,
    },
    {
      email: "student3@ttpu.uz",
      title: "Yangi topshiriq",
      body: "MATH 1 kursida yangi topshiriq e'lon qilindi.",
      link: "/courses/math1/assignments",
      isRead: false,
    },
    {
      email: "student3@ttpu.uz",
      title: "Tizim ishga tushdi",
      body: "TTPU LMS demo tizimiga xush kelibsiz!",
      link: "/dashboard",
      isRead: true,
    },
    {
      email: "student4@ttpu.uz",
      title: "Topshiriq baholandi",
      body: "MATH 1 topshirig'ingiz baholandi: 40/50.",
      link: "/courses/math1/assignments",
      isRead: false,
    },
    {
      email: "student4@ttpu.uz",
      title: "Yangi test",
      body: "MATH 1 kursida yangi test e'lon qilindi: Test 2.",
      link: "/courses/math1",
      isRead: true,
    },
    {
      email: "student5@ttpu.uz",
      title: "Tizim ishga tushdi",
      body: "TTPU LMS demo tizimiga xush kelibsiz!",
      link: "/dashboard",
      isRead: false,
    },
  ];

  for (const n of notificationPlan) {
    await ensureNotification(created[n.email].id, n.title, {
      body: n.body,
      link: n.link,
      isRead: n.isRead,
    });
  }

  console.log("Seed tayyor. Demo loginlar (parol: ttpu1234):");
  console.log("  admin@ttpu.uz | n.mahamatov@ttpu.uz | ozodbek@ttpu.uz");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
