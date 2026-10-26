// ===== 1. Шапка меняет вид при прокрутке =====
const header = document.getElementById("header");

window.addEventListener("scroll", () => {
  // Если прокрутили больше 50 пикселей — добавляем класс "scrolled"
  header.classList.toggle("scrolled", window.scrollY > 50);
});


// ===== 2. Мобильное меню (бургер) =====
// Находим кнопку и меню по их id
const burger = document.getElementById("burger");
const nav = document.getElementById("nav");

// При клике на бургер — открываем или закрываем меню
burger.addEventListener("click", () => {
  nav.classList.toggle("open");
  burger.classList.toggle("open"); // полоски превращаются в крестик
});

// Когда нажали на пункт меню — закрываем меню
nav.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
    burger.classList.remove("open");
  });
});


// ===== 3. Появление элементов при прокрутке =====
// IntersectionObserver «следит», когда элемент попадает на экран
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target); // анимация срабатывает один раз
    }
  });
}, { threshold: 0.15 }); // сработать, когда видно 15% элемента

document.querySelectorAll(".reveal").forEach((el, index) => {
  // Небольшая задержка, чтобы соседние элементы появлялись «лесенкой»
  el.style.transitionDelay = `${(index % 3) * 0.12}s`;
  observer.observe(el);
});


// ===== 4. Счётчики в блоке «О нас» =====
// Число плавно растёт от 0 до значения из data-target
function animateCounter(el) {
  const target = Number(el.dataset.target);
  const suffix = el.dataset.suffix || "";
  const duration = 1500; // длительность в миллисекундах
  const start = performance.now();

  function update(now) {
    const progress = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(progress * target) + suffix;
    if (progress < 1) requestAnimationFrame(update); // следующий кадр
  }
  requestAnimationFrame(update);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      animateCounter(entry.target);
      counterObserver.unobserve(entry.target);
    }
  });
});

document.querySelectorAll("[data-target]").forEach((el) => counterObserver.observe(el));


// ===== 5. Фильтр меню кофейни =====
const filters = document.querySelectorAll(".filter");
const cards = document.querySelectorAll(".card");

filters.forEach((button) => {
  button.addEventListener("click", () => {
    // Подсвечиваем нажатую кнопку, с остальных подсветку снимаем
    filters.forEach((b) => b.classList.remove("active"));
    button.classList.add("active");

    // Какую категорию выбрали: "all", "coffee" или "dessert"
    const category = button.dataset.filter;

    // Прячем карточки, которые не подходят под категорию
    cards.forEach((card) => {
      const match = category === "all" || card.dataset.category === category;
      card.classList.toggle("hidden", !match);
    });
  });
});


// ===== 6. Форма бронирования =====
// Адрес Cloudflare Worker, который пересылает заявки в Telegram (код — в файле worker.js).
// Если сюда вписать что-то, что не начинается с https://, форма перейдёт в демо-режим.
const WORKER_URL = "https://zerno-form.infinian55555.workers.dev";

const form = document.getElementById("form");
const formMessage = document.getElementById("formMessage");
const formButton = document.getElementById("formButton");

form.addEventListener("submit", async (event) => {
  event.preventDefault(); // не даём странице перезагрузиться

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const website = document.getElementById("website").value; // поле-ловушка

  // Демо-режим: адрес Worker ещё не вставлен
  if (!WORKER_URL.startsWith("https://")) {
    formMessage.textContent = `Спасибо, ${name}! Мы скоро вам перезвоним ☕`;
    form.reset();
    return;
  }

  formButton.disabled = true;
  formButton.textContent = "Отправляем...";

  try {
    // fetch отправляет данные на Worker, а тот пересылает их в Telegram
    const response = await fetch(WORKER_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, website }),
    });

    if (!response.ok) throw new Error("Ошибка сервера");

    formMessage.textContent = `Спасибо, ${name}! Мы скоро вам перезвоним ☕`;
    form.reset(); // очищаем поля
  } catch (error) {
    formMessage.textContent = "Не получилось отправить 😔 Позвоните нам: +7 (999) 123-45-67";
  } finally {
    // В любом случае возвращаем кнопку в обычное состояние
    formButton.disabled = false;
    formButton.textContent = "Отправить";
  }
});


// ===== 7. Просмотр фото на весь экран (лайтбокс) =====
// Собираем все фото, которые можно открыть, в один список
const photos = [...document.querySelectorAll(".card__img img, .about__img img, .gallery img")];
const lightbox = document.getElementById("lightbox");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxCaption = document.getElementById("lightboxCaption");
let currentPhoto = 0; // номер открытого фото

function showPhoto(index) {
  // Если ушли за край списка — переходим на другой конец (по кругу)
  currentPhoto = (index + photos.length) % photos.length;
  const photo = photos[currentPhoto];
  // На странице фото маленькие (w=600), а тут берём крупную версию
  lightboxImg.src = photo.src.replace(/w=\d+/, "w=1600");
  lightboxImg.alt = photo.alt;
  lightboxCaption.textContent = photo.alt;
}

function openLightbox(index) {
  showPhoto(index);
  lightbox.classList.add("open");
  document.body.style.overflow = "hidden"; // запрещаем прокрутку страницы под фото
}

function closeLightbox() {
  lightbox.classList.remove("open");
  document.body.style.overflow = "";
}

// Клик по любому фото открывает его
photos.forEach((photo, index) => {
  photo.addEventListener("click", () => openLightbox(index));
});

document.getElementById("lightboxClose").addEventListener("click", closeLightbox);
document.getElementById("lightboxPrev").addEventListener("click", () => showPhoto(currentPhoto - 1));
document.getElementById("lightboxNext").addEventListener("click", () => showPhoto(currentPhoto + 1));

// Клик по тёмному фону (не по фото и не по кнопкам) — закрыть
lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

// Управление с клавиатуры: Esc — закрыть, стрелки — листать
document.addEventListener("keydown", (event) => {
  if (!lightbox.classList.contains("open")) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showPhoto(currentPhoto - 1);
  if (event.key === "ArrowRight") showPhoto(currentPhoto + 1);
});


// ===== 8. Текущий год в подвале =====
document.getElementById("year").textContent = new Date().getFullYear();
