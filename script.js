
let brands = [];
let imageUrls = [];

function loadingImage() {
    $("#imageList").empty();

    sessionStorage.setItem('brands', JSON.stringify(brands));
    imageUrls = brands.map(brand => brand.img);

    brands.forEach(brand => {
        $("#imageList").append(`
            <li>
                <a href="${brand.link}">
                    <img src="${brand.img}" alt="${brand.name}">
                </a>
                <p>${brand.name}</p>
            </li>
        `);
    });

    $('.carouselSection').slick({
        speed: 300,
        slidesToShow: 4,
        slidesToScroll: 4,
        // responsive: []
      });
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


