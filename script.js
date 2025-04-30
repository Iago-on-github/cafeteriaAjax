// function verifyActiveCarousel() {
//     if (imageUrls.length >= 4) {

//     }
//

function loadingImage(url) {
    $.ajax({
        url: url,
        method: 'GET',
        dataType: 'html',
        success: function (data) {
            $("#imageList").empty();

            sessionStorage.setItem('brands', JSON.stringify(brands));
            imageUrls = brands.map(brand => brand.img);

            brands.forEach(brand => {
                $("#imageList").append(`
                    <li>
                        <a href="${brand.link}">
                            <img src="${brand.img}" alt="${brand.name}" style="width: 200px; margin: 10px;">
                        </a>
                        <p>${brand.name}</p>
                    </li>
                `);
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log("Erro ao buscar imagens: ", textStatus, errorThrown);
        }
    });
}

let brands = [];
let imageUrls = [];

$(data).find("ul.nivel-dois > li").each(function() {
    if ($(this).attr('class') && $(this).attr('class').startsWith('categoria-marca-')) {

        let brandName = $(this).find('a').text().trim(); 
        // let brandImage = $(this).find('.marca-info .image.pull-right img').attr('src');
        // let brandLink = $(this).find('a').attr('href');

        $.ajax({
            url: 'https://loja-convite-teste.lojaintegrada.com.br/marca/' + brandName,
            method: 'GET',
            dataType: 'html',
            success: function(data) {
                let brandImage = $(this).find(".marca-info > img").attr('src');
            }
        });
        brands.push({link: brandLink, img: brandImage, name: brandName});
    }
});

loadingImage('https://loja-convite-teste.lojaintegrada.com.br/categoria/17437623.html?fq=');

// $('.carouselSection').slick({
//     slidesToShow: 3,
//     slidesToScroll: 3,
//     prevArrow: '<button class="slick-prev-banner">&#8592;</button>',
//     nextArrow: '<button class="slick-next-banner">&#8594;</button>',
//     responsive: [
//         {
//             breakpoint: 667,
//             settings: {
//                 slidesToShow: 3,
//                 slidesToScroll: 3,
//                 speed: 300,
//                 infinite: true
//             }
//         },
//     ]
// });

