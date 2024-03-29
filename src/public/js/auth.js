"use strict";

const login = document.getElementById("login");
const loginButton = document.getElementById("login-button");
const loginMark = document.getElementById("login-message");
const logoutButton = document.getElementById("logout-button");

const pb = new PocketBase("http://127.0.0.1:8090");

let showLogin = false;
let loginMessage = null;
welcome.hidden = showLogin;

function init() {
  pb.afterSend = function (response, data) {
    if (response.statusCode === 401) {
      showLogin = true;
    }
    welcome.hidden = showLogin;
    return data;
  };

  if (!window.localStorage.getItem("pocketbase_auth")) {
    showLogin = true;
    welcome.hidden = showLogin;
    return;
  }

  const auth = JSON.parse(window.localStorage.getItem("pocketbase_auth"));
  pb.authStore.save(auth.token, auth.model);

  const input = welcome.querySelector("input");
  input.value = auth.model.email;

  login.hidden = !showLogin;
  welcome.hidden = showLogin;
}

async function handleLogin() {
  try {
    const authData = await pb
      .collection("users")
      .authWithOAuth2({ provider: "fourtytwo" });

    const projectData = authData.meta.rawUser.projects_users.filter(
      // (project) => project.status === "in_progress"
      (project) => project.status === "waiting_for_correction"
    );
    const inEval = projectData.length > 0 ? true : false;

    const data = {
      username: `${authData.record.username}`,
      email: `${authData.record.email}`,
      emailVisibility: `${authData.record.emailVisibility}`,
      name: `${authData.meta.name}`,
      inEvaluation: inEval,
      kind: `${authData.meta.rawUser.kind}`,
    };

    const record = await pb
      .collection("users")
      .update(`${authData.record.id}`, data);

    localStorage.setItem("userd", JSON.stringify(data));

    if (inEval) {
      alert(
        "Seems you are waiting for evaluation. \n\nTo secure the value of 42, please login after your evaluation."
      );
      loginMessage = "Please login after you finish your evaluation.";
      loginMark.innerHTML = loginMessage;
      pb.authStore.clear();
      showLogin = true;
    } else {
      const input = welcomeForm.querySelector("input");
      input.value = data.email;
      showLogin = false;
    }
  } catch (error) {
    loginMessage = error;
    loginMark.innerHTML = loginMessage;
    showLogin = true;
  }
  login.hidden = !showLogin;
  welcome.hidden = showLogin;
}

async function handleLogout() {
  pb.authStore.clear();
  showLogin = true;
  login.hidden = !showLogin;
  welcome.hidden = showLogin;
}

loginButton.addEventListener("click", handleLogin);
logoutButton.addEventListener("click", handleLogout);

init();
