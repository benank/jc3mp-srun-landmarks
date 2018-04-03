$(document).ready(function() 
{
    $('html').css('visibility', 'visible');

    jcmp.AddEvent('set_type', (type) => 
    {
        if (type == "MAP_BUY" || type == "WEAPON_BUY")
        {
            $('div.container').html(`Press <b style='color: red'>E</b> to open the shop`);
        }
        else if (type == "CHEST_SELL")
        {
            $('div.container').html(`Press <b style='color: red'>F</b> to sell chest`);
        }
        else if (type == "CHEST_SELL_NOPE")
        {
            $('div.container').html(`Bring a chest here to sell it`);
        }
    })
})
