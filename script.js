let brands = [];
let imageUrls = [];

function loadingImage() {
    $("#imageList").empty();

    sessionStorage.setItem('brands', JSON.stringify(brands));
    imageUrls = brands.map(brand => brand.img);

    if ($(".categoria-marcas.com-filho.borda-principal").length && $("#listagemProdutos").length) {
        let html = "";
    
        brands.forEach(brand => {
            let nomeFormatado = brand.name.replace(/\s*\(.*?\)/g, '').toLowerCase();
            html += `
                <li>
                    <a href="${brand.link}">
                        <img src="${brand.img}" alt="${brand.name}">
                    </a>
                    <p>${nomeFormatado}</p>
                </li>
            `;
        });
    
        const carouselHTML = `
            <section class="carouselSection">
                <div class="carouselContainer">
                    <ul id="imageList">
                        ${html}
                    </ul>
                </div>
            </section>
        `;
    
        $("#listagemProdutos").before(carouselHTML);

        setTimeout(() => {
            $('#imageList').slick({
                infinite: true,
                slidesToShow: 5, // <-- quantidade correta
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
                ]});
        }, 100);
    }
}  

function fetchBrands() {

    $.ajax({
        url: 'https://loja-convite-teste.lojaintegrada.com.br/',
        method: 'GET',
        dataType: 'html',
        success: function (data) {
            let items = $(data).find("ul.nivel-dois > li").filter(function () {
                return $(this).attr('class')?.startsWith('categoria-marca-');
            });

            let pending = items.length;

            items.each(function () {
                let brandName = $(this).find('a').text().trim();
                let brandLink = $(this).find('a').attr('href');

                if (brandLink && !brandLink.startsWith('http')) {
                    brandLink = new URL(brandLink, 'https://loja-convite-teste.lojaintegrada.com.br/').href;
                }

                $.ajax({
                    url: brandLink,
                    method: 'GET',
                    dataType: 'html',
                    success: function (pageData) {
                        let brandImage = $(pageData).find(".marca-info .image.pull-right img").attr('src');

                        brands.push({
                            name: brandName,
                            link: brandLink,
                            img: brandImage
                        });
                    },
                    complete: function () {
                        pending--;
                        if (pending === 0) {
                            loadingImage();
                        }
                    },
                    error: function () {
                        console.warn(`Erro ao buscar imagem da marca: ${brandName}`);
                        pending--;
                        if (pending === 0) {
                            loadingImage();
                        }
                    }
                });
            });
        },
        error: function () {
            console.log("Erro ao carregar painel de marcas");
        }
    });
}

fetchBrands();