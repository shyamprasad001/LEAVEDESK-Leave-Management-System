// Mobile sidebar toggle
function openSidebar() {
  var sidebar = document.querySelector(".sidebar");
  var overlay = document.querySelector(".sidebar-overlay");
  if (sidebar) sidebar.classList.add("open");
  if (overlay) overlay.classList.add("show");
}

function closeSidebar() {
  var sidebar = document.querySelector(".sidebar");
  var overlay = document.querySelector(".sidebar-overlay");
  if (sidebar) sidebar.classList.remove("open");
  if (overlay) overlay.classList.remove("show");
}

document.addEventListener("DOMContentLoaded", function () {
  var overlay = document.querySelector(".sidebar-overlay");
  if (overlay) {
    overlay.addEventListener("click", closeSidebar);
  }
});

// Auto hide flash messages after 4 seconds
setTimeout(function () {
  var msgs = document.querySelectorAll(".msg-success, .msg-error");
  msgs.forEach(function (el) {
    el.style.display = "none";
  });
}, 4000);

// Date validation - end date >= start date
var startDate = document.querySelector('input[name="startDate"]');
var endDate = document.querySelector('input[name="endDate"]');
if (startDate && endDate) {
  startDate.addEventListener("change", function () {
    endDate.min = this.value;
    if (endDate.value && endDate.value < this.value) {
      endDate.value = this.value;
    }
  });
}

// Character counter for reason textarea
var reasonBox = document.querySelector('textarea[name="reason"]');
var counter = document.getElementById("reason-counter");
if (reasonBox && counter) {
  reasonBox.addEventListener("input", function () {
    counter.textContent = this.value.length + "/500";
    counter.style.color = this.value.length > 450 ? "red" : "#777";
  });
}

// Toggle password visibility
function togglePwd() {
  var inp = document.getElementById("password");
  var btn = document.getElementById("toggle-btn");
  if (!inp) return;
  if (inp.type === "password") {
    inp.type = "text";
    btn.textContent = "Hide";
  } else {
    inp.type = "password";
    btn.textContent = "Show";
  }
}
