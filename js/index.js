document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll(".site-nav a");

  /*nav links mixing with border color once clicked with only white text popping*/
  links.forEach(link => {
    if (link.href === window.location.href) {
      link.style.background = "#4e387e";
      link.style.color = "#fff";
    }
  });
});