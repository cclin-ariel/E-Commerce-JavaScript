const client = contentful.createClient({
  // This is the space ID. A space is like a project folder in Contentful terms
  space: "x5854l3ofv89",
  // This is the access token for this space. Normally you get both ID and the token in the Contentful web app
  accessToken: "s_07SRi4pogumqvsufH71YW5tc6jHNzwoO1vjINptSE",
});

// variable
const cartBtn = document.querySelector(".cart-btn");
const closeCartBtn = document.querySelector(".close-cart");
const clearCartBtn = document.querySelector(".clear-cart");
const cartDOM = document.querySelector(".cart");
const cartOverlay = document.querySelector(".cart-overlay");
const cartItems = document.querySelector(".cart-items");
const cartTotal = document.querySelector(".cart-total");
const cartContent = document.querySelector(".cart-content");
const productsDOM = document.querySelector(".products-center");

// cart
let cart = [];

// button from UI.getBagButtons()
let buttonsDOM = [];

// getting the products
class Products {
  async getProducts() {
    try {
      const contentful = await client.getEntries({ content_type: "title" });

      // let result = await fetch("products.JSON");
      // let data = await result.json();

      // make the data to an Array
      let products = contentful.items;
      products = products.map((item) => {
        const { title, price } = item.fields;
        const { id } = item.sys;
        const image = item.fields.image.fields.file.url;
        return { title, price, id, image };
      });
      return products; // products array
    } catch (error) {
      console.log(error);
    }
  }
}
// display products
class UI {
  displayProducts(products) {
    let productInnerHTML = ""; // string
    products.forEach((product) => {
      productInnerHTML += `
        <!-- single products -->
            <article class="product">
                <div class="img-container">
                    <img class="product-img" src=${product.image} alt="product">
                    <button class="addToCart-btn" data-id=${product.id}>
                        <i class="fas fa-shopping-car"></i>
                        add to cart
                    </button>
                </div>
                <h3>${product.title}</h3>
                <h4>$${product.price}</h4>
            </article>
            <!-- end of single products -->
        `;
    });
    productsDOM.innerHTML = productInnerHTML;
  }

  getBagButtons() {
    const buttons = [...document.querySelectorAll(".addToCart-btn")]; // turn node list to array
    buttonsDOM = buttons;
    buttons.forEach((button) => {
      let id = button.dataset.id;
      let inCart = cart.find((item) => item.id === id);

      if (inCart) {
        button.innerHTML = "In Cart";
        button.disabled = true;
      }
      button.addEventListener("click", (e) => {
        e.target.innerHTML = "In Cart";
        e.target.disabled = true;

        // get product from products in the local storage
        let cartItem = { ...Storage.getProduct(id), amount: 1 }; // spread the property and amount property of obj

        // add product to the cart
        cart = [...cart, cartItem];

        // save cart in local storage
        Storage.saveCart(cart);

        // set cart value
        this.setCartValue(cart);

        // display cart item
        this.addCartItem(cartItem);

        //show the cart
        this.showCart();
      });
    });
  }

  setCartValue(cart) {
    let tempTotal = 0;
    let itemsTotal = 0;
    cart.map((item) => {
      tempTotal += item.price * item.amount;
      itemsTotal += item.amount;
    });
    cartTotal.innerHTML = parseFloat(tempTotal.toFixed(2));
    cartItems.innerHTML = itemsTotal;
  }

  addCartItem(item) {
    const div = document.createElement("div");
    div.classList.add("cart-item");
    div.innerHTML = `
                    <img src=${item.image} alt="product">
                    <div>
                        <h4>${item.title}</h4>
                        <h5>$${item.price}</h5>
                        <span class="remove-item" data-id=${item.id}>remove</span>
                    </div>
                    <div>
                        <i class="fas fa-chevron-up" data-id=${item.id}></i>
                        <p class="item-amount">${item.amount}</p>
                        <i class="fas fa-chevron-down" data-id=${item.id}></i>
                    </div>`;
    cartContent.appendChild(div);
  }

  showCart() {
    cartOverlay.classList.add("transparentBcg");
    cartDOM.classList.add("showCart");
  }

  setupAPP() {
    cart = Storage.getCart();
    this.setCartValue(cart);
    this.populateCart(cart);
    cartBtn.addEventListener("click", this.showCart);
    closeCartBtn.addEventListener("click", this.hideCart);
  }

  populateCart(cart) {
    cart.forEach((item) => this.addCartItem(item));
  }

  hideCart() {
    cartOverlay.classList.remove("transparentBcg");
    cartDOM.classList.remove("showCart");
  }

  cartLogic() {
    // clear cart button
    clearCartBtn.addEventListener("click", () => this.clearCart());

    // cart functionality
    cartContent.addEventListener("click", (e) => {
      if (e.target.classList.contains("remove-item")) {
        let removeTargetBtn = e.target;
        let id = removeTargetBtn.dataset.id;
        cartContent.removeChild(removeTargetBtn.parentNode.parentNode);
        this.removeItem(id);
      } else if (e.target.classList.contains("fa-chevron-up")) {
        let addAmountBtn = e.target;
        let id = addAmountBtn.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount++;
        Storage.saveCart(cart);
        this.setCartValue(cart);
        addAmountBtn.nextElementSibling.innerHTML = tempItem.amount;
      } else if (e.target.classList.contains("fa-chevron-down")) {
        let lowerAmountBtn = e.target;
        let id = lowerAmountBtn.dataset.id;
        let tempItem = cart.find((item) => item.id === id);
        tempItem.amount--;
        if (tempItem.amount <= 0) {
          cartContent.removeChild(lowerAmountBtn.parentNode.parentNode);
          this.removeItem(id);
        }
        Storage.saveCart(cart);
        this.setCartValue(cart);
        lowerAmountBtn.previousElementSibling.innerHTML = tempItem.amount;
      }
    });
  }

  clearCart() {
    // clear cart button
    let cartItems = cart.map((item) => item.id);
    cartItems.forEach((id) => this.removeItem(id));

    // remove the items in the cart
    while (cartContent.children.length > 0) {
      cartContent.removeChild(cartContent.children[0]);
    }
    this.hideCart();
  }
  removeItem(id) {
    cart = cart.filter((item) => item.id !== id);
    this.setCartValue(cart);
    Storage.saveCart(cart);
    let button = this.getSingleButton(id);
    button.disabled = false;
    button.innerHTML = `<i class="fas fa-shopping-car"></i>
    add to cart`;
  }

  getSingleButton(id) {
    return buttonsDOM.find((button) => button.dataset.id === id);
  }
}
// local storage
class Storage {
  static saveProducts(products) {
    localStorage.setItem("products", JSON.stringify(products));
  }
  static getProduct(id) {
    let products = JSON.parse(localStorage.getItem("products"));
    return products.find((product) => product.id === id);
  }
  static saveCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
  }
  static getCart() {
    return localStorage.getItem("cart")
      ? JSON.parse(localStorage.getItem("cart"))
      : [];
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const ui = new UI();
  const getProducts = new Products();

  //setup APP
  ui.setupAPP();

  // get all products
  getProducts
    .getProducts()
    .then((products) => {
      ui.displayProducts(products);
      Storage.saveProducts(products);
    })
    .then(() => {
      ui.getBagButtons();
      ui.cartLogic();
    });
});
