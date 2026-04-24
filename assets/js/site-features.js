(function () {
    "use strict";

    var STORAGE_KEYS = {
        cart: "cart",
        pageHistory: "kidsToys:lastPage",
        newsletterDraft: "kidsToys:newsletterDraft",
        newsletterSubscribers: "kidsToys:newsletterSubscribers",
        contactDraft: "kidsToys:contactDraft",
        contactMessages: "kidsToys:contactMessages",
        profileDraft: "kidsToys:profileDraft",
        productFilters: "kidsToys:productFilters"
    };

    function readJSON(key, fallbackValue) {
        try {
            var rawValue = localStorage.getItem(key);
            return rawValue ? JSON.parse(rawValue) : fallbackValue;
        } catch (error) {
            return fallbackValue;
        }
    }

    function writeJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn("Unable to save data for", key, error);
        }
    }

    function updateCartBadge() {
        var cartData = readJSON(STORAGE_KEYS.cart, { count: 0, total: 0 });
        var count = cartData && typeof cartData.count === "number" ? cartData.count : 0;
        var badges = document.querySelectorAll("#cart-count");

        badges.forEach(function (badge) {
            badge.textContent = count;
        });
    }

    function rememberCurrentPage() {
        writeJSON(STORAGE_KEYS.pageHistory, {
            title: document.title,
            path: window.location.pathname.split("/").pop(),
            visitedAt: new Date().toISOString()
        });
    }

    function setupNewsletterPersistence() {
        var form = document.getElementById("newsletter-form");
        if (!form) {
            return;
        }

        var input = form.querySelector("input[type='email']");
        if (!input) {
            return;
        }

        var savedDraft = readJSON(STORAGE_KEYS.newsletterDraft, { email: "" });
        if (savedDraft && savedDraft.email) {
            input.value = savedDraft.email;
        }

        input.addEventListener("input", function () {
            writeJSON(STORAGE_KEYS.newsletterDraft, { email: input.value.trim() });
        });

        form.addEventListener("submit", function () {
            var email = input.value.trim();
            if (!email) {
                return;
            }

            var subscribers = readJSON(STORAGE_KEYS.newsletterSubscribers, []);
            var alreadySaved = subscribers.some(function (entry) {
                return entry.email.toLowerCase() === email.toLowerCase();
            });

            if (!alreadySaved) {
                subscribers.push({
                    email: email,
                    page: window.location.pathname.split("/").pop(),
                    subscribedAt: new Date().toISOString()
                });
                writeJSON(STORAGE_KEYS.newsletterSubscribers, subscribers);
            }

            writeJSON(STORAGE_KEYS.newsletterDraft, { email: "" });
        });
    }

    function setupContactDraft() {
        var form = document.getElementById("contact-form");
        if (!form) {
            return;
        }

        var fields = {
            name: document.getElementById("name"),
            email: document.getElementById("email"),
            phone: document.getElementById("phone"),
            subject: document.getElementById("subject"),
            message: document.getElementById("message")
        };

        var savedDraft = readJSON(STORAGE_KEYS.contactDraft, {});
        Object.keys(fields).forEach(function (key) {
            if (fields[key] && savedDraft[key]) {
                fields[key].value = savedDraft[key];
            }
        });

        function saveDraft() {
            var draft = {};
            Object.keys(fields).forEach(function (key) {
                draft[key] = fields[key] ? fields[key].value.trim() : "";
            });
            writeJSON(STORAGE_KEYS.contactDraft, draft);
        }

        Object.keys(fields).forEach(function (key) {
            if (fields[key]) {
                fields[key].addEventListener("input", saveDraft);
            }
        });

        form.addEventListener("submit", function () {
            var messages = readJSON(STORAGE_KEYS.contactMessages, []);
            messages.push({
                name: fields.name ? fields.name.value.trim() : "",
                email: fields.email ? fields.email.value.trim() : "",
                phone: fields.phone ? fields.phone.value.trim() : "",
                subject: fields.subject ? fields.subject.value.trim() : "",
                message: fields.message ? fields.message.value.trim() : "",
                sentAt: new Date().toISOString()
            });
            writeJSON(STORAGE_KEYS.contactMessages, messages);
            writeJSON(STORAGE_KEYS.contactDraft, {});
        });
    }

    function setupProfileDraft() {
        var form = document.querySelector(".profile-form");
        if (!form) {
            return;
        }

        var fields = {
            name: document.getElementById("name"),
            email: document.getElementById("email"),
            courses: document.getElementById("courses")
        };

        var namePreview = document.getElementById("profile-name");
        var emailPreview = document.getElementById("profile-email");
        var coursesPreview = document.getElementById("profile-courses");
        var savedProfile = readJSON("profile", {});
        var savedDraft = readJSON(STORAGE_KEYS.profileDraft, {});
        var initialValues = Object.assign({}, savedProfile, savedDraft);

        Object.keys(fields).forEach(function (key) {
            if (fields[key] && initialValues[key]) {
                fields[key].value = initialValues[key];
            }
        });

        function updatePreview() {
            if (namePreview && fields.name && fields.name.value.trim()) {
                namePreview.textContent = fields.name.value.trim();
            }
            if (emailPreview && fields.email && fields.email.value.trim()) {
                emailPreview.textContent = fields.email.value.trim();
            }
            if (coursesPreview && fields.courses && fields.courses.value.trim()) {
                coursesPreview.textContent = fields.courses.value.trim();
            }
        }

        function saveDraft() {
            writeJSON(STORAGE_KEYS.profileDraft, {
                name: fields.name ? fields.name.value.trim() : "",
                email: fields.email ? fields.email.value.trim() : "",
                courses: fields.courses ? fields.courses.value.trim() : ""
            });
            updatePreview();
        }

        updatePreview();

        Object.keys(fields).forEach(function (key) {
            if (fields[key]) {
                fields[key].addEventListener("input", saveDraft);
            }
        });

        form.addEventListener("submit", function () {
            window.setTimeout(function () {
                writeJSON(STORAGE_KEYS.profileDraft, {});
            }, 0);
        });
    }

    function setupProductFilters() {
        var searchInput = document.getElementById("products-search-input");
        var searchButton = document.getElementById("products-search-btn");
        var categoryButtons = document.querySelectorAll(".category-btn");

        if (!searchInput || !searchButton || !categoryButtons.length) {
            return;
        }

        var savedFilters = readJSON(STORAGE_KEYS.productFilters, {
            category: "all",
            query: ""
        });

        function persistFilters() {
            var activeButton = document.querySelector(".category-btn.active");
            writeJSON(STORAGE_KEYS.productFilters, {
                category: activeButton ? activeButton.getAttribute("data-category") : "all",
                query: searchInput.value.trim()
            });
        }

        categoryButtons.forEach(function (button) {
            button.addEventListener("click", function () {
                window.setTimeout(persistFilters, 0);
            });
        });

        searchInput.addEventListener("input", persistFilters);
        searchButton.addEventListener("click", function () {
            window.setTimeout(persistFilters, 0);
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "/" && document.activeElement !== searchInput) {
                var tagName = document.activeElement && document.activeElement.tagName;
                if (tagName !== "INPUT" && tagName !== "TEXTAREA") {
                    event.preventDefault();
                    searchInput.focus();
                }
            }
        });

        window.addEventListener("load", function () {
            if (savedFilters.query) {
                searchInput.value = savedFilters.query;
            }

            if (savedFilters.category) {
                var matchingButton = document.querySelector('.category-btn[data-category="' + savedFilters.category + '"]');
                if (matchingButton && !matchingButton.classList.contains("active")) {
                    matchingButton.click();
                }
            }

            if (savedFilters.query) {
                searchButton.click();
            }
        });
    }

    document.addEventListener("DOMContentLoaded", function () {
        updateCartBadge();
        rememberCurrentPage();
        setupNewsletterPersistence();
        setupContactDraft();
        setupProfileDraft();
        setupProductFilters();

        window.addEventListener("storage", updateCartBadge);
        window.addEventListener("focus", updateCartBadge);
    });

    window.KidsToysProject = {
        readJSON: readJSON,
        writeJSON: writeJSON,
        updateCartBadge: updateCartBadge
    };
})();
