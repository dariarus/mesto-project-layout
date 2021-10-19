import './index.css'; //подключить в файл точки входа основной файл стилей - работает только для Webpack

import {validationConfig, userSelectors} from "../components/variables.js";
import UserInfo from "../components/UserInfo.js";
import Avatar from "../components/Avatar.js";
import Section from "../components/Section.js";
import FormValidator from "../components/FormValidate.js"
import Card from "../components/Card";
import Api from "../components/Api.js";
import PopupWithForm from "../components/PopupWithForm";
import PopupWithImage from "../components/PopupWithImage";


const popupOpenPhoto = new PopupWithImage('.popup_type_open-photo');
let userInfo;

const api = new Api({
  baseUrl: 'https://mesto.nomoreparties.co/v1/plus-cohort-1',
  headers: {
    authorization: '020e494d-03bf-4222-970c-2fbceefd04a5',
    'Content-Type': 'application/json'
  }
});

window.onload = function () {
  api.getUser()
    .then(user => {
      userInfo = user;
    })
    .then(() => {
      initUserInfo(userInfo, userSelectors);
      initCards(userInfo);
      initPopupAddCard();
      initPopupEditProfile();
      initPopupChangeAvatar();
    });
};


function initUserInfo(userData, userSelectors) {
  const initUserInfo = new UserInfo(userSelectors);
  initUserInfo.setUserInfo(userInfo);

  const userAvatar = new Avatar(userData);
  userAvatar.setAvatar();
}


function initCards(user) {
  api.getCards()
    .then((cardList) => {
      let cardsSection = new Section({
        data: cardList,
        renderer: (cardData) => {
          const card = new Card(cardData, '#card-template', {
            deleteCard: (evt) => {
              api.deleteCard(cardData._id)
                .then(() => {
                  // кнопка кликнута - выбор ближайшего родителя кликнутой кнопки
                  const targetToDelete = evt.target.closest('.gallery-item');
                  // удаление карточки (ближайшего родителя кликнутой кнопки), по иконке удаления которой кликнул пользователь
                  targetToDelete.remove();
                })
                .catch((err) => {
                  console.log(err);
                })
            },
            handleCardClick: () => {
              popupOpenPhoto.open(cardData);
            },
            setLike: (evt, card) => {
              if (cardData.likes && cardData.likes.some(like => like._id === user._id)) {
                api.deleteLike(cardData._id)
                  .then(likedCard => {
                    cardData.likes = likedCard.likes;
                    // поскольку есть card, в который прокинут this, evt.target для определения кликнутого лайка больше не нужен
                    // изменение класса для кикнутого лайка (установленного и снятого)
                    card.removeLikeColor();
                    card.refreshLikesCount();
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              } else {
                api.putLike(cardData._id)
                  .then(likedCard => {
                    cardData.likes = likedCard.likes;
                    // изменение класса для кикнутого лайка (установленного и снятого)
                    card.setLikeColor();
                    card.refreshLikesCount();
                  })
                  .catch((err) => {
                    console.log(err);
                  });
              }
            }
          });
          const cardElement = card.generateElement();
          if (cardData.likes && cardData.likes.some(like => like._id === user._id)) {
            card.setLikeColor();
          }
          if (user._id === cardData.owner._id) {
            card.setDeleteElement();
          }
          cardsSection.setItem(cardElement);
        }
      }, '.gallery');
      cardsSection.renderItems();
    })
    .catch((err) => {
      console.log(err);
    })
}


function initFormValidator(popup) {
  const formValidator = new FormValidator(validationConfig, popup._formElement);
  formValidator.enableValidation();
  popup._formElement.addEventListener('opened', () => { // подписываемся на кастомное событие (см. файл FormValidator.js)
    formValidator.hideInitialInputError();
    formValidator.toggleButtonInPopup();
  })
}

function initPopupAddCard() {
  const buttonAddCard = document.querySelector('.profile__add-button');
  const popupAddCard = new PopupWithForm('.popup_type_add-card', (popup) => {
    const buttonSaveCard = popup._popupElement.querySelector('.popup__save-button');
    buttonSaveCard.textContent = "Сохранение...";

    const inputValues = popup._getInputValues();

    api.createNewCard(inputValues.name, inputValues.link)
      .then(cardData => {
        cardsSection.renderItem(cardData);
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        buttonSaveCard.textContent = "Создать";
      })
  });
  buttonAddCard.addEventListener('click', () => {
    popupAddCard.open();
  });

  initFormValidator(popupAddCard);
}

function initPopupEditProfile() { //TODO: связать с юзером, убрать контент из разметки
  const buttonEditProfile = document.querySelector('.profile__edit-button');
  const popupEditProfile = new PopupWithForm('.popup_type_edit-profile', (popup) => {

    const buttonSaveProfile = popup._popupElement.querySelector('.popup__save-button');
    buttonSaveProfile.textContent = 'Сохранение...';

    const inputValues = popup._getInputValues();

    const usernameElement = document.querySelector('.profile__username');
    const userInfoElement = document.querySelector('.profile__user-info');

    // вставка новых значений с помощью textContent на страницу из полей формы, значения которых извлекаются с помощью value
    api.saveProfile(inputValues.name, inputValues.about)
      .then(result => {
        usernameElement.textContent = result.name;
        userInfoElement.textContent = result.about;
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        buttonSaveProfile.textContent = 'Сохранить';
      })
  });



  buttonEditProfile.addEventListener('click', () => {
    const userInfo = new UserInfo(userSelectors);
    const user = userInfo.getUserInfo();

    popupEditProfile.setInputValue('name', user.name);
    popupEditProfile.setInputValue('about', user.about);
    popupEditProfile.open();
  });

  initFormValidator(popupEditProfile);
}

function initPopupChangeAvatar() {
  const buttonChangeAvatar = document.querySelector('.profile__edit-avatar-button');
  const popupChangeAvatar = new PopupWithForm('.popup_type_update-avatar', (popup) => {

    const buttonSubmitEditAvatar = popup._popupElement.querySelector('.popup__save-button');
    buttonSubmitEditAvatar.textContent = 'Сохранение...';

    const inputValues = popup._getInputValues();

    api.updateAvatarUrl(inputValues.avatar)
      .then(user => {
        const imageAvatar = document.querySelector('.profile__avatar');
        imageAvatar.src = user.avatar;
      })
      .catch((err) => {
        console.log(err);
      })
      .finally(() => {
        buttonSubmitEditAvatar.textContent = 'Сохранить';
      })
  })
  buttonChangeAvatar.addEventListener('click', () => {
    popupChangeAvatar.open();
  });

  initFormValidator(popupChangeAvatar);
}
