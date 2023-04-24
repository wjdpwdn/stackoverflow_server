//  🚨 돈터치 : npm start 하면 3001 포트로 열립니다.
const express = require("express");
const session = require("express-session");
const cors = require("cors");

const app = express();
const PORT = 3002;

// cors 허용
app.use(cors({ credentials: true, origin: "http://localhost:3000" }));
// express 사용
app.use(express.json());
//
app.use(
  session({
    secret: "mySecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      domain: "localhost",
      secure: false,
      httpOnly: true,
      maxAge: 3600000,

      // 🚨 실제 배포 단계에서는 https 서버 사용과 동시에
      // sameSite, secure 옵션이 설정되어 있어야 안전합니다.

      // sameSite: 'none',
      // secure: true,
    },
  })
);

// ⭐️ 데이터 베이스

let questions = [
  {
    creator: "1@1",
    title: "취업할수 있을까?",
    contents: "코드스테이츠 수료까지 했습니다.",
    expect: "정말 할수 있을까요?",
    createdAt: "2023-04-19T23:39:32.792Z",
    updatedAt: "2023-04-19T23:39:32.792Z",
    id: 1,
  },
];
// 질문의 답글을 저장한 배열
let answers = [
  {
    creator: "2@2",
    contents: "그럼요!",
    createdAt: "2023-04-21T10:12:51.855Z",
    updatedAt: "2023-04-21T10:12:51.855Z",
    id: 1,
  },
];
// 사용자 정보를 저장할 배열
let members = [
  {
    id: 1,
    membername: "하나",
    password: "1",
    email: "1@1",
    reputation: 0,
    aboutme: "안녕하세요 하나입니다.",
  },
  {
    id: 2,
    membername: "두리",
    password: "1",
    email: "2@2",
    reputation: 0,
    aboutme: "안녕하세요 두리입니다.",
  },
];

// 1️⃣ 계정요청

// 1️⃣ − 2️⃣ 회원가입

app.post("/signup", (req, res) => {
  const { email, password, membername } = req.body;

  // 이미 등록된 이메일 또는 닉네임인지 체크
  const member = members.find(
    (member) => member.email === email || member.membername === membername
  );
  if (member) {
    if (member.email === email) {
      res.json({ success: false, message: "이미 등록된 이메일입니다." });
    } else {
      res.json({ success: false, message: "이미 등록된 닉네임입니다." });
    }
  } else {
    // 새로운 사용자 정보 생성
    const id = Math.floor(Math.random() * 100000); // 5자리 랜덤 숫자 생성
    const aboutme = `안녕하세요 ${membername}입니다.`; // 기본값 설정
    const reputation = 0;
    const newMember = { email, password, membername, aboutme, id, reputation };
    members.push(newMember);
    res.json({ success: true, message: "회원가입이 완료되었습니다." });
  }
});

// 1️⃣ − 3️⃣ 로그인

app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 등록된 사용자인지 체크
  const member = members.find(
    (member) => member.email === email && member.password === password
  );
  if (member) {
    // 로그인 정보를 세션에 저장
    req.session.member = member;

    // 쿠키에 로그인 정보를 저장
    res.cookie("memberName", member.membername, { maxAge: 3600000 });
    res.cookie("aboutme", member.aboutme, { maxAge: 3600000 });
    res.cookie("isLoggedin", true, { maxAge: 3600000 });
    res.cookie("email", member.email, { maxAge: 3600000 });

    res.json({ success: true });
  } else {
    res.json({
      success: false,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    });
  }
});

/* 실패코드
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // 등록된 사용자인지 체크
  const member = members.find(
    (member) => member.email === email && member.password === password
  );
  if (member) {
    req.session.member = { email };
    res.cookie("isLoggedin", true, { maxAge: 3600000 });
    res.json({ success: true });
  } else {
    res.json({
      success: false,
      message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    });
  }
})*/

// 로그아웃 −−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−

app.post("/logout", (req, res) => {
  // 세션에서 사용자 정보 삭제
  req.session.destroy((error) => {
    if (error) {
      console.log(error);
      res.json({ success: false });
    } else {
      // 쿠키에서 로그인 여부 제거
      res.clearCookie("isLoggedin");
      res.clearCookie("memberName");
      res.clearCookie("aboutme");
      res.clearCookie("email");
      // 세션 삭제

      res.json({ success: true });
    }
  });
});

// 조회 −−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−-

app.get("/members", (req, res) => {
  res.json(members);
});

app.get("/questions", (req, res) => {
  res.json(questions);
});

app.get("/answers", (req, res) => {
  res.json(answers);
});

// 계정 삭제 −−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−−

app.delete("/members/:email", (req, res) => {
  const email = req.params.email;

  const index = members.findIndex((member) => member.email === email);

  if (index === -1) {
    // 해당 이메일을 가진 사용자가 존재하지 않을 때
    res
      .status(404)
      .json({ message: "해당 이메일을 가진 사용자가 존재하지 않습니다." });
    return;
  }

  // 사용자 삭제
  members.splice(index, 1);

  // 세션 삭제
  req.session.destroy();

  res.json({ message: "회원탈퇴가 완료되었습니다." });
});

//  🚨 돈터치
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
