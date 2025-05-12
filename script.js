// verificação da página atual para exibir ou não o carrossel
function isCategoryOrSearchPage() {
    const urlBy = window.location.href.includes("/buscar?q=") || window.location.href.includes("/categoria/");

    const dom = $(".categoria-marcas.com-filho.borda-principal").length > 0 ||
                $("#listagemProduto".length > 0) ||
                $(".facetaMarca").length > 0;

    return urlBy || dom;
    // return window.location.href.includes("/buscar?q=") || window.location.href.includes("/categoria/");
}

let brands = [];
let imageUrls = [];

// atualiza/filtra a url para as requisições
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
    }

    params.delete('fq');

    if (marcasSelecionadas.length > 0) {
        const filtroFinal = `P__2__Marca:${marcasSelecionadas.join('++')}`;
        params.append('fq', filtroFinal);
    }

    return `${url.pathname}?${params.toString()}`;
}

function renderBrandCarousel() {
    $('.carouselSection')?.remove();
    
    $("#imageList").empty();

    sessionStorage.setItem('brands', JSON.stringify(brands));
    imageUrls = brands.map(brand => brand.img);

    if ($(".categoria-marcas.com-filho.borda-principal").length && $("#listagemProdutos").length && isCategoryOrSearchPage()) {
        const urlParams = new URLSearchParams(window.location.search);

        const availableBrandNames = $(".faceta-marca .atributo-lista ul li a label")
            .map(function () {
                return $(this).text().replace(/\s*\(\d+\)/, "").trim();
            }).get();

        const activeFilters = urlParams.getAll('fq')
            .filter(p => p.startsWith('P__2__Marca:'))
            .flatMap(p => p.replace('P__2__Marca:', '').split('++'));

        const uniqueBrands = [];
        const seenNames = new Set();

        for (const brand of brands) {
            const cleanedName = brand.name.replace(/\s*\(.*?\)/g, '').trim();
            if (!seenNames.has(cleanedName)) {
                seenNames.add(cleanedName);
                uniqueBrands.push({ ...brand, cleanedName });
            }
        }

        const html = uniqueBrands
            .filter(brand => availableBrandNames.includes(brand.cleanedName))
            .map(brand => {
                const brandLink = updateBrandFilterUrl(brand.cleanedName);
                const isActive = activeFilters.includes(brand.cleanedName);

                return `
                    <li class="${isActive ? 'active-brand' : ''}">
                        <a href="${brandLink}">
                            <img src="${brand.img}" alt="${brand.name}">
                        </a>
                        <p>${brand.cleanedName.toLowerCase()}</p>
                    </li>
                `;
            }).join('');

        if (!html) return;

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
            const $imageList = $('#imageList');
            const brandCount = $imageList.find('li').length;
        
            if ($imageList.hasClass('slick-initialized')) {
                $imageList.slick('unslick');
            }
        
            if (brandCount <= 3) {
                $imageList.addClass('static-brand-list');
                return;
            }
        
            $imageList.removeClass('static-brand-list');
        
            $imageList.slick({
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
        const cb = $(selector);
        if (cb) {
            callback();
        } else {
            setTimeout(() => waitForElement(selector, callback), 100);
        }
    }

    $(document).ready(() => {
        let cachedBrands = JSON.parse(sessionStorage.getItem('brands') || '[]');
        let cachedBrandNames = new Set(cachedBrands.map(b => b.name.trim()));

        brands = [...cachedBrands];

        $.ajax({
            url: window.location.href,
            method: 'GET',
            dataType: 'html',
            success: function (data) {
                const items = $(data).find("ul.nivel-dois > li").filter(function () {
                    return $(this).attr('class')?.startsWith('categoria-marca-');
                });

                let pending = items.length;
                let newBrandsCount = 0;

                if (pending === 0) {
                    waitForElement("#listagemProdutos", renderBrandCarousel);
                    return;
                }

                items.each(function () {
                    let { name, link, imgLink } = extractBrandData(this);

                    if (cachedBrandNames.has(name)) {
                        pending--;
                        if (pending === 0) {
                            sessionStorage.setItem('brands', JSON.stringify(brands));
                            waitForElement("#listagemProdutos", renderBrandCarousel);
                        }
                        return;
                    }

                    fetchBrandImage(imgLink, name, (brandName, brandImage) => {
                        if (brandImage) {
                            brands.push({
                                name: brandName,
                                link: link,
                                img: brandImage
                            });
                            newBrandsCount++;
                        }

                        pending--;
                        if (pending === 0) {
                            if (newBrandsCount > 0) {
                                sessionStorage.setItem('brands', JSON.stringify(brands));
                            }
                            waitForElement("#listagemProdutos", renderBrandCarousel);
                        }
                    });
                });
            },
            error: function () {
                console.log("Erro ao carregar painel de marcas");
                waitForElement("#listagemProdutos", renderBrandCarousel);
            }
        });
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