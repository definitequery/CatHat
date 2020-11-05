// Get the modal
var createModal = document.getElementById("createCourse");
var joinModal = document.getElementById("joinCourse");

// Get the button that opens the modal
var createCourseBtn = document.getElementById("create-course-button");
var joinCourseBtn = document.getElementById("join-course-button");

var createCancel = document.getElementsByClassName("close")[0];
var joinCancel = document.getElementsByClassName("close")[1];

// When the user clicks on the button, open the modal

if (createCourseBtn) {
  createCourseBtn.onclick = function() {
    createModal.style.display = "block";
  } 
  createCancel.onclick = function() {
    createModal.style.display = "none";
  }
}

if (joinCourseBtn) {
  joinCourseBtn.onclick = function() {
    joinModal.style.display = 'block';
  }
  joinCancel.onclick = function() {
    joinModal.style.display = "none";
  }
}

// When the user clicks anywhere outside of the modal, close it
window.onClick = function(event) {
  if (event.target == createModal) {
    createModal.style.display = "none";
    joinModal.style.display = "none";
  }
}