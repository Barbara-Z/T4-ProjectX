fetch("/session")
  .then(res => res.json())
  .then(user => {
    const area = document.getElementById("userArea");

    if (!user) {
      area.innerHTML = `
        <a href="login.html">Login</a>
        <a href="register.html">Registrieren</a>
      `;
    } else {
      area.innerHTML = `
        <span class="user-icon">👤</span>
        ${user.username}
        <a href="/logout">Logout</a>
      `;
    }
  });