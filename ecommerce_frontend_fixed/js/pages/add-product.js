import { createProduct } from "../services/productService.js";

document.getElementById("addProductForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData();

    formData.append("name", document.querySelector('[name="name"]').value);
    formData.append("description", document.querySelector('[name="description"]').value);
    formData.append("price", document.querySelector('[name="price"]').value);
    formData.append("stock", document.querySelector('[name="stock"]').value);
    formData.append("category", document.querySelector('[name="category"]').value);

    const fileInput = document.getElementById("productFile");

    if (!fileInput.files.length) {
        alert("Please select an image");
        return;
    }

    formData.append("file", fileInput.files[0]);

    for (const pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }

    try {
        const result = await createProduct(formData);

        console.log(result);

        alert("Product added successfully");

        location.href = "admin-products.html";
    } catch (error) {
        console.error(error);
        alert(error.message);
    }
});