document.addEventListener("DOMContentLoaded", function() {
    // 1. ЛОГИКА ДЛЯ ФОТОГРАФИИ ПРОФИЛЯ
    const avatarInput = document.getElementById('avatar');
    const photoButton = document.querySelector('.profile-form__photo-button');

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

    // 2. ОСТАЛЬНАЯ ЛОГИКА ФОРМЫ (Маски, валидация и т.д.)
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
    }

    fioInputs.forEach(input => {
        if(input) {
            input.addEventListener('input', function() {
                this.value = this.value.replace(/[^a-zA-Zа-яА-ЯёЁ-]/g, '');
            });
        }
    });

    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', function(event) {
            let isValid = true;
            document.querySelectorAll('.js-error').forEach(el => el.textContent = '');
            document.querySelectorAll('.profile-form__input').forEach(el => el.classList.remove('profile-form__input--error'));

            let showError = function(inputId, message) {
                const input = document.getElementById(inputId);
                const errorDiv = document.getElementById('error-' + inputId);
                if (input && errorDiv) {
                    input.classList.add('profile-form__input--error');
                    errorDiv.textContent = message;
                }
                isValid = false;
            };

            if (document.getElementById('lastname').value.trim() === '') showError('lastname', 'Фамилия не может быть пустой');
            if (document.getElementById('firstname').value.trim() === '') showError('firstname', 'Имя не может быть пустым');

            const password = document.getElementById('password').value;
            if (password.length > 0) {
                if (password.length < 8 || password.length > 25) {
                    showError('password', 'Пароль должен быть от 8 до 25 символов');
                }
                const passwordConfirm = document.getElementById('password_confirm').value;
                if (password !== passwordConfirm) showError('password_confirm', 'Пароли не совпадают');
            }

            if (document.getElementById('birthdate').value === '') showError('birthdate', 'Укажите дату рождения');

            const phone = phoneInput.value.trim();
            if (phone === '' || phone === phonePrefix) {
                showError('phone', 'Номер телефона не может быть пустым');
            } else if (!/^\+\d{10,14}$/.test(phone)) {
                showError('phone', 'Неверный формат номера телефона');
            }

            const email = document.getElementById('email').value.trim();
            if (email === '') {
                showError('email', 'Электронная почта не может быть пустой');
            } else if (!email.includes('@')) {
                showError('email', 'Электронная почта должна содержать "@"');
            }

            const volunteerId = volunteerInput.value.trim();
            if (volunteerId === '' || volunteerId === volunteerPrefix) {
                showError('volunteer_id', 'Номер книжки не может быть пустым');
            } else if (volunteerId.length !== 13) {
                showError('volunteer_id', 'После "ВК-" должно идти ровно 10 цифр');
            }

            if (!isValid) event.preventDefault();
        });
    }
});