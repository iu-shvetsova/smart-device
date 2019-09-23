'use strict';

const openButton = document.querySelector('.main-header__button');
const popup = document.querySelector('.popup');
const closeButton = popup.querySelector('.popup__close-button');
const checkbox = popup.querySelector('.feedback__checkbox');
const submitButton = popup.querySelector('.feedback__button');

const onSubmitButtonClick = () => {
    popup.classList.remove('popup--opened');
    document.removeEventListener(onCloseButtonClick);
    document.removeEventListener(onSubmitButtonClick);
};

const onCloseButtonClick = () => {
    popup.classList.remove('popup--opened');
    document.removeEventListener(onCloseButtonClick);
    document.removeEventListener(onSubmitButtonClick);
};

openButton.addEventListener('click', (evt) => {
    evt.preventDefault();
    popup.classList.add('popup--opened');
    closeButton.addEventListener('click', onCloseButtonClick);
    closeButton.addEventListener('click', onSubmitButtonClick);
});

checkbox.addEventListener('change', () => {
    if (checkbox.checked) {
        submitButton.disabled = false;
    } else {
        submitButton.disabled = true;
    }
});

submitButton.disabled = true;