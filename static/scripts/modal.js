// Get the modal
var modal = document.getElementById("createCourse");

// Get the button that opens the modal
var createCourseBtn = document.getElementById("create-course-button");

var span = document.getElementsByClassName("close")[0];

// When the user clicks on the button, open the modal
createCourseBtn.onclick = function() {
    modal.style.display = "block";
}

span.onclick = function() {
  modal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onClick = function(event) {
  if (event.target == modal) {
    modal.style.display = "none";
  }
}