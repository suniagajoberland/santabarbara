// CONFIGURACIÓN DE ENDPOINTS DE PRODUCCIÓN
const URL_API_SHEETS =
  "https://script.google.com/macros/s/AKfycbxVlL-oqlTEhj33ROnx3bwJnZtXzMpDp2ekVqeiVCw99SZL5No82oTFndvaZYnzyPZ-Tw/exec";
const WHATSAPP_PHONE = "584143693311";

let listaProductos = [];
let carrito = [];
let letraSeleccionada = "TODOS";

document.addEventListener("DOMContentLoaded", conectarConInventarioSheets);

async function conectarConInventarioSheets() {
  try {
    const respuesta = await fetch(URL_API_SHEETS);
    if (!respuesta.ok) throw new Error("Fallo en la comunicación con Sheets.");

    listaProductos = await respuesta.json();
    filtrarYRenderizar();
  } catch (error) {
    console.error("Error operativo de carga:", error);
    document.getElementById("contenedor-secciones").innerHTML =
      `<p class="empty-cart-text" style="color:red;">No se pudo sincronizar el inventario. Revise la conexión de su hoja.</p>`;
  }
}

function filtrarPorLetra(letra) {
  letraSeleccionada = letra;

  const botones = document.querySelectorAll(".letter-btn");
  botones.forEach((btn) => {
    if (
      btn.innerText.toUpperCase() === letra.toUpperCase() ||
      (letra === "TODOS" && btn.innerText.toLowerCase() === "todos")
    ) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });

  filtrarYRenderizar();
}

function filtrarYRenderizar() {
  const contenedorPrincipal = document.getElementById("contenedor-secciones");
  contenedorPrincipal.innerHTML = "";

  let productosFiltrados = listaProductos;
  if (letraSeleccionada !== "TODOS") {
    productosFiltrados = listaProductos.filter(
      (p) =>
        p.nombre && p.nombre.trim().toUpperCase().startsWith(letraSeleccionada),
    );
  }

  if (productosFiltrados.length === 0) {
    contenedorPrincipal.innerHTML = `<p class="empty-cart-text">No se encontraron productos que comiencen con la letra "${letraSeleccionada}".</p>`;
    return;
  }

  const categoriasUnicas = [
    ...new Set(
      productosFiltrados.map((p) =>
        p.categoria ? p.categoria.trim() : "General",
      ),
    ),
  ];

  categoriasUnicas.forEach((cat) => {
    const itemsCategoria = productosFiltrados.filter(
      (p) => (p.categoria ? p.categoria.trim() : "General") === cat,
    );

    if (itemsCategoria.length === 0) return;

    const seccionSemantica = document.createElement("section");
    seccionSemantica.className = "category-section";

    const titulo = document.createElement("h2");
    titulo.className = "category-title";
    titulo.innerText = cat;
    seccionSemantica.appendChild(titulo);

    const grid = document.createElement("div");
    grid.className = "products-grid";

    itemsCategoria.forEach((prod) => {
      const tarjeta = document.createElement("div");
      tarjeta.className = "product-card";

      const urlImagen =
        prod.imagen && prod.imagen.trim() !== ""
          ? prod.imagen.trim()
          : "https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500";

      tarjeta.innerHTML = `
                <img src="${urlImagen}" alt="${prod.nombre}" loading="lazy" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=500';">
                <div class="product-card-body">
                    <h3>${prod.nombre}</h3>
                    <p class="price">$${parseFloat(prod.precio).toFixed(2)}</p>
                    <button class="btn-add-to-cart" onclick="insertarItemCarrito('${prod.id}')">Agregar al Pedido</button>
                </div>
            `;
      grid.appendChild(tarjeta);
    });

    seccionSemantica.appendChild(grid);
    contenedorPrincipal.appendChild(seccionSemantica);
  });
}

function insertarItemCarrito(id) {
  const itemOriginal = listaProductos.find((p) => String(p.id) === String(id));
  if (!itemOriginal) return;

  const enCarrito = carrito.find((item) => String(item.id) === String(id));
  if (enCarrito) {
    enCarrito.amount += 1;
  } else {
    carrito.push({
      id: itemOriginal.id,
      nombre: itemOriginal.nombre,
      precio: parseFloat(itemOriginal.precio),
      amount: 1,
    });
  }
  actualizarInterfazVisual();
}

function cambiarCantidadItem(id, variacion) {
  const item = carrito.find((item) => String(item.id) === String(id));
  if (!item) return;

  item.amount += variacion;
  if (item.amount <= 0) {
    carrito = carrito.filter((item) => String(item.id) !== String(id));
  }
  actualizarInterfazVisual();
}

function actualizarInterfazVisual() {
  const wrapper = document.getElementById("items-carrito");
  const totalLabel = document.getElementById("cart-total");
  const badgeNavbar = document.getElementById("cart-count");

  wrapper.innerHTML = "";
  let subtotalGeneral = 0;
  let badgeTotal = 0;

  if (carrito.length === 0) {
    wrapper.innerHTML = `<p class="empty-cart-text">El carrito está vacío</p>`;
    totalLabel.innerText = "$0.00";
    badgeNavbar.innerText = "0";
    return;
  }

  carrito.forEach((item) => {
    const subtotalFila = item.precio * item.amount;
    subtotalGeneral += subtotalFila;
    badgeTotal += item.amount;

    const filaElemento = document.createElement("div");
    filaElemento.className = "cart-item-row";
    filaElemento.innerHTML = `
            <div class="item-meta">
                <h4>${item.nombre}</h4>
                <p>$${item.precio.toFixed(2)} x ${item.amount}</p>
            </div>
            <div class="item-controls">
                <button onclick="cambiarCantidadItem('${item.id}', -1)">-</button>
                <span>${item.amount}</span>
                <button onclick="cambiarCantidadItem('${item.id}', 1)">+</button>
            </div>
        `;
    wrapper.appendChild(filaElemento);
  });

  totalLabel.innerText = `$${subtotalGeneral.toFixed(2)}`;
  badgeNavbar.innerText = badgeTotal;
}

function abrirCarrito() {
  const panel = document.getElementById("carrito-panel");
  panel.classList.add("is-visible");
  panel.setAttribute("aria-hidden", "false");
}

function cerrarCarrito() {
  const panel = document.getElementById("carrito-panel");
  panel.classList.remove("is-visible");
  panel.setAttribute("aria-hidden", "true");
}

document
  .getElementById("checkout-form")
  .addEventListener("submit", function (e) {
    e.preventDefault();

    if (carrito.length === 0) {
      alert("Agrega artículos a la orden primero.");
      return;
    }

    const nombre = document.getElementById("nombre-cliente").value.trim();
    const cedula = document.getElementById("cedula-cliente").value.trim();
    const telefono = document.getElementById("telefono-cliente").value.trim();
    const direccion = document.getElementById("direccion-cliente").value.trim();

    let mensajeTxt = `*NUEVO PEDIDO - SANTA BÁRBARA*\n\n`;
    mensajeTxt += `*Cliente:* ${nombre}\n`;
    mensajeTxt += `*Cédula:* ${cedula}\n`;
    mensajeTxt += `*Teléfono:* ${telefono}\n`;
    mensajeTxt += `*Dirección:* ${direccion}\n`;
    mensajeTxt += `----------------------------------\n`;

    let totalCierre = 0;
    carrito.forEach((item) => {
      const operacionSubtotal = item.precio * item.amount;
      totalCierre += operacionSubtotal;
      mensajeTxt += `• ${item.nombre} (x${item.amount}) - $${operacionSubtotal.toFixed(2)}\n`;
    });

    mensajeTxt += `----------------------------------\n`;
    mensajeTxt += `*TOTAL COMPRA: $${totalCierre.toFixed(2)}*\n\n`;
    mensajeTxt += `Enviado desde el catálogo web.`;

    const apiLink = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE}&text=${encodeURIComponent(mensajeTxt)}`;

    window.open(apiLink, "_blank");
    limpiarEstructurasYFormularios();
  });

function limpiarEstructurasYFormularios() {
  carrito = [];
  actualizarInterfazVisual();
  document.getElementById("checkout-form").reset();
  cerrarCarrito();
}
