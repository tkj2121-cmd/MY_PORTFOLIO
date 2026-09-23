// ===============================
// NAVBAR SCROLL EFFECT
// ===============================

window.addEventListener("scroll", () => {

    const header = document.querySelector("header");

    if (window.scrollY > 50) {

        header.style.boxShadow = "0 5px 25px rgba(0, 0, 0, 0.3)";

    } else {

        header.style.boxShadow = "none";

    }

});


// ===============================
// SKILL BARS: FILL WHEN VISIBLE
// ===============================

const skillFills = document.querySelectorAll(".skill-fill");

const skillObserver = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (entry.isIntersecting) {

            entry.target.classList.add("in-view");

            skillObserver.unobserve(entry.target);

        }

    });

}, { threshold: 0.4 });

skillFills.forEach(fill => skillObserver.observe(fill));