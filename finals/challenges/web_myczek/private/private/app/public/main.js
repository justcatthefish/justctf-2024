function checkLoginStatus() {
  const token = localStorage.getItem('jwtToken');
  if (token) {
    document.getElementById('changePasswordContainer').style.display = 'block';
    document.getElementById('flagContainer').style.display = 'block';
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('registerContainer').style.display = 'none';
  } else {
    document.getElementById('changePasswordContainer').style.display = 'none';
    document.getElementById('flagContainer').style.display = 'none';
  }
}

document.addEventListener('DOMContentLoaded', checkLoginStatus);

document.getElementById('registerForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value;
  const password = document.getElementById('registerPassword').value;

  const response = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  document.getElementById('registerMessage').textContent = result.message;
});

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });

  const result = await response.json();
  if (result.accessToken) {
    localStorage.setItem('jwtToken', result.accessToken);
    document.getElementById('loginMessage').textContent = 'Logged in successfully!';
    checkLoginStatus();
  } else {
    document.getElementById('loginMessage').textContent = result.message;
  }
});

document.getElementById('changePasswordForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const token = localStorage.getItem('jwtToken');
  const old_password = document.getElementById('changeOldPassword').value;
  const password = document.getElementById('changePassword').value;

  const response = await fetch('/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ old_password, password })
  });

  const result = await response.json();
  document.getElementById('changePasswordMessage').textContent = result.message;
});

document.getElementById('getFlagButton').addEventListener('click', async function() {
  const token = localStorage.getItem('jwtToken');
  if (!token) {
    document.getElementById('flagMessage').textContent = 'You need to login first!';
    return;
  }

  const response = await fetch('/auth/flag', {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const result = await response.json();
  document.getElementById('flagMessage').textContent = result.flag || result.message;
});
