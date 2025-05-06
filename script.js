function isCategoryOrSearchPage() {
    return window.location.href.includes("/buscar?q=") || window.location.href.includes("/categoria/");
}

let brands = [];
let imageUrls = [];

function updateBrandFilterUrl(cleanedName) {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    let currentBrandFilter = params.getAll('fq').find(p => p.startsWith('P__2__Marca:'));

    let marcasSelecionadas = [];

    if (currentBrandFilter) {
        const marcasString = currentBrandFilter.split(':')[1];
        marcasSelecionadas = marcasString.split('++');
    }

    const index = marcasSelecionadas.indexOf(cleanedName);
    if (index > -1) {
        marcasSelecionadas.splice(index, 1);
    } else {
        marcasSelecionadas.push(cleanedName);

        params.delete('fq');

        if (marcasSelecionadas.length > 0) {
            const filtroFinal = `P__2__Marca:${marcasSelecionadas.join('++')}`;
            params.append('fq', filtroFinal);
        }

        return `${url.pathname}?${params.toString()}`;
    }
}



function renderBrandCarousel() {
    $("#imageList").empty();

    sessionStorage.setItem('brands', JSON.stringify(brands));
    imageUrls = brands.map(brand => brand.img);

    if ($(".categoria-marcas.com-filho.borda-principal").length && $("#listagemProdutos").length && isCategoryOrSearchPage()) {

        const urlParams = new URLSearchParams(window.location.search);
        const activeFilters = urlParams.getAll('fq').filter(p => p.startsWith('P__2__Marca:'));

        const html = brands.map(brand => {
            const cleanedName = brand.name.replace(/\s*\(.*?\)/g, '').trim();
            const brandLink = updateBrandFilterUrl(cleanedName);

            const filtroAtual = `P__2__Marca:${cleanedName}`;
            const isActive = activeFilters.includes(filtroAtual);

            return `
                <li class="${isActive ? 'active-brand' : ''}">
                    <a href="${brandLink}">
                        <img src="${brand.img}" alt="${brand.name}">
                    </a>
                    <p>${cleanedName.toLowerCase()}</p>
                </li>
            `;
        }).join('');

        const carouselHTML = `
            <section class="carouselSection">
                <h2 class="carouselTitle">Filtre por Marca</h2>
                <div class="carouselContainer">
                    <ul id="imageList">${html}</ul>
                </div>
            </section>
        `;

        $(".breadcrumbs.borda-alpha").before(carouselHTML);

        setTimeout(() => {
            $('#imageList').slick({
                infinite: true,
                slidesToShow: 5,
                slidesToScroll: 1,
                prevArrow: '<button class="slick-prev">&#8592;</button>',
                nextArrow: '<button class="slick-next">&#8594;</button>',
                responsive: [
                    {
                        breakpoint: 1024,
                        settings: {
                            slidesToShow: 2,
                            slidesToScroll: 1
                        }
                    }
                ]
            });
        }, 100);
    }
}

function fetchBrands() {
    function waitForElement(selector, callback) {
        const el = document.querySelector(selector);
        if (el) {
            callback();
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }

    const cachedBrands = sessionStorage.getItem('brands');

    $(document).ready(() => {
        if (cachedBrands) {
            brands = JSON.parse(cachedBrands);
            imageUrls = brands.map(brand => brand.img);
            waitForElement("#listagemProdutos", renderBrandCarousel);
            return;
        }
    });

    $.ajax({
        url: window.location.href,
        method: 'GET',
        dataType: 'html',
        success: function (data) {
            const items = $(data).find("ul.nivel-dois > li").filter(function () {
                return $(this).attr('class')?.startsWith('categoria-marca-');
            });

            let pending = items.length;

            items.each(function () {
                let { name, link, imgLink } = extractBrandData(this);

                if (link && !link.startsWith('http')) {
                    link = new URL(link, window.location.href).href;
                }

                fetchBrandImage(imgLink, name, (brandName, brandImage) => {
                    if (brandImage) {
                        brands.push({
                            name: brandName,
                            link: link,
                            img: brandImage
                        });
                    }

                    pending--;
                    if (pending === 0) {
                        renderBrandCarousel();
                    }
                });
            });
        },
        error: function () {
            console.log("Erro ao carregar painel de marcas");
        }
    });
}

function extractBrandData(item) {
    const brandName = $(item).find('a').text().trim();
    const imgLink = $(item).find('a').attr('href');
    const name = brandName.replace(/\s*\(.*?\)/g, '').trim();
    const link = `${window.location.origin}/buscar?fq=P__2__Marca:${encodeURIComponent(name)}`;

    return { name, link, imgLink };
}

function fetchBrandImage(brandImageLink, brandName, callback) {
    $.ajax({
        url: brandImageLink,
        method: 'GET',
        dataType: 'html',
        success: function (pageData) {
            const brandImage = $(pageData).find(".marca-info .image.pull-right img").attr('src');
            callback(brandName, brandImage);
        },
        error: function () {
            console.warn(`Erro ao buscar imagem da marca: ${brandName}`);
            callback(brandName, null);
        }
    });
}

fetchBrands();
