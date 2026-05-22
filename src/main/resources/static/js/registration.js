document.addEventListener("DOMContentLoaded", function() {
    // 1. ЛОГИКА ДЛЯ ФОТОГРАФИИ
    const avatarInput = document.getElementById('avatar'); // ИСПРАВЛЕНО ТУТ!
    const photoButton = document.querySelector('.reg-form__photo-button');

    if (avatarInput && photoButton) {
        avatarInput.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                photoButton.textContent = 'Фото загружено';
                photoButton.style.backgroundColor = '#2ecc71';
                photoButton.style.color = '#fff';
                photoButton.style.borderColor = '#2ecc71';
            } else {
                photoButton.textContent = 'Загрузить';
                photoButton.style.backgroundColor = '';
                photoButton.style.color = '';
                photoButton.style.borderColor = '';
            }
        });
    }

    // 2. ОСТАЛЬНАЯ ЛОГИКА ФОРМЫ
    const volunteerInput = document.getElementById('volunteer_id');
    const phoneInput = document.getElementById('phone');
    const fioInputs = [document.getElementById('lastname'), document.getElementById('firstname'), document.getElementById('patronymic')];

    const volunteerPrefix = 'ВК-';
    const phonePrefix = '+';

    if (volunteerInput) {
        volunteerInput.addEventListener('focus', function() { if (this.value === '') this.value = volunteerPrefix; });
        volunteerInput.addEventListener('blur', function() { if (this.value === volunteerPrefix) this.value = ''; });
        volunteerInput.addEventListener('input', function() {
            if (this.value === '') return;
            if (!this.value.startsWith(volunteerPrefix)) { this.value = volunteerPrefix; return; }
            const digitsPart = this.value.substring(volunteerPrefix.length).replace(/\D/g, '');
            this.value = volunteerPrefix + digitsPart;
        });
        volunteerInput.addEventListener('keydown', function(e) {
            if (this.selectionStart < volunteerPrefix.length && (e.key === 'Backspace' || e.key === 'Delete')) e.preventDefault();
        });
    }

    if (phoneInput) {
        phoneInput.addEventListener('focus', function() { if (this.value === '') this.value = phonePrefix; });
        phoneInput.addEventListener('blur', function() { if (this.value === phonePrefix) this.value = ''; });
        phoneInput.addEventListener('input', function() {
            if (this.value === '') return;
            if (!this.value.startsWith(phonePrefix)) { this.value = phonePrefix; return; }
            const digits = this.value.substring(phonePrefix.length).replace(/\D/g, '');
            this.value = phonePrefix + digits;
        });
        phoneInput.addEventListener('keydown', function(e) {
            if (this.selectionStart < phonePrefix.length && (e.key === 'Backspace' || e.key === 'Delete')) e.preventDefault();
        });
    }

    fioInputs.forEach(input => {
        if (input) {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-Zа-яА-ЯёЁ-]/g, '');
            });
        }
    });

    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(event) {
            let isValid = true;
            document.querySelectorAll('.js-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.reg-form__input').forEach(el => {
                el.classList.remove('reg-form__input--error');
                const group = el.closest('.reg-form__group');
                if(group) group.classList.remove('reg-form__group--error');
            });

            let showError = function(inputId, message) {
                const input = document.getElementById(inputId);
                const group = input.closest('.reg-form__group');
                const errorDiv = document.getElementById('error-' + inputId);
                if (input && group && errorDiv) {
                    input.classList.add('reg-form__input--error');
                    group.classList.add('reg-form__group--error');
                    errorDiv.textContent = message;
                }
                isValid = false;
            };

            const lastname = document.getElementById('lastname').value.trim();
            if (lastname === '') showError('lastname', 'Фамилия не может быть пустой');

            const firstname = document.getElementById('firstname').value.trim();
            if (firstname === '') showError('firstname', 'Имя не может быть пустым');

            const login = document.getElementById('login').value.trim();
            if (login === '') showError('login', 'Логин не может быть пустым');
            else if (login.length < 3 || login.length > 20) showError('login', 'Логин должен быть от 3 до 20 символов');

            const password = document.getElementById('password').value;
            if (password === '') showError('password', 'Пароль не может быть пустым');
            else if (password.length < 8 || password.length > 25) showError('password', 'Пароль должен быть от 8 до 25 символов');

            const passwordConfirm = document.getElementById('password_confirm').value;
            if (password !== '' && password !== passwordConfirm) showError('password_confirm', 'Пароли не совпадают');

            const birthdate = document.getElementById('birthdate').value;
            if (birthdate === '') showError('birthdate', 'Укажите дату рождения');

            const phone = phoneInput.value.trim();
            if (phone === '' || phone === phonePrefix) showError('phone', 'Номер телефона не может быть пустым');
            else if (!/^\+\d{11}$/.test(phone)) showError('phone', 'Телефон должен содержать 11 цифр после "+"');

            const email = document.getElementById('email').value.trim();
            if (email === '') showError('email', 'Электронная почта не может быть пустой');
            else if (!email.includes('@')) showError('email', 'Электронная почта должна содержать "@"');

            const volunteerId = volunteerInput.value.trim();
            if (volunteerId === '' || volunteerId === volunteerPrefix) showError('volunteer_id', 'Номер книжки не может быть пустым');
            else if (volunteerId.length !== 13) showError('volunteer_id', 'После "ВК-" должно быть ровно 10 цифр');

            if (!isValid) event.preventDefault();
        });
    }
});