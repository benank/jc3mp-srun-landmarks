$(document).ready(function() 
{
    $('html').css('visibility', 'visible');

    const open_key = 77; // M
    let open = false;
    let can_open = true;
    let bought_maps = {};

    let gold = 0;

    const landmark_data = {}; // landmark data from other events
    const entries = [];

    $('div.map-shop div.main-container').empty();

    $('div.tooltip').hide();

    /**
     * Adds an entry to the shop.
     * @param {*} data - An object containing:
     * - landmark_name: The name of the landmark that this map belongs to
     * - cost: The cost of this map
     * - bought: whether or not this item has been bought yet
     */
    function AddEntry(data)
    {
        if (landmark_data[data.landmark_name] && landmark_data[data.landmark_name].discovered)
        {
            let $container;
            let $item_container;

            $('div.landmark-container>div.landmark-title>font.name').each(function()
            {
                if ($(this).text() == data.landmark_name)
                {
                    $container = $(this).parent().parent();
                    $item_container = $container.find('div.item-container').first();
                }
            })

            const icon = landmark_data[data.landmark_name].icon ? landmark_data[data.landmark_name].icon : 'anchor';

            if (!$container)
            {
                $container = $(`<div class='landmark-container'></div>`);
                $container.append(`<div class='landmark-title'><i class='fa fa-${icon}'></i> <font class='name'>${data.landmark_name}</font> <i class='fa fa-${icon}'></i></div>`);
                $item_container = $(`<div class='item-container'></div>`);
                $container.append($item_container);
                $('div.map-shop>div.main-container').append($container);
            }


            const $item = $(`<div class='item'></div>`)
            $item.append(`<div class='price' style='color:${gold >= data.cost ? 'rgb(50,50,50)' : 'red'};'>${data.cost}<img src='coin.png' class='money-icon'></div>`);
            $item.append(`<i class='fa fa-question'></i>`);
            $item.data('data', data);

            if (data.bought)
            {
                $item.addClass('bought');
            }

            $item_container.append($item);
        }
        else
        {
            entries.push(data); // Store here for later
        }

    }

    /**
     * Called when a player discovers a new landmark, so we have to loop through them and add the entries we don't have.
     */
    function UpdateKnownLandmarks(name)
    {
        for (let j = 0; j < entries.length; j++)
        {
            if (entries[j].landmark_name == name)
            {
                AddEntry(entries[j]);
            }
        }
    }

    function BuyEntry()
    {

    }
    
    $(document).on('click', '.item', function(e)
    {
        if ($(this).hasClass('bought')) {return;}

        const $cost = $(this).find('div.price').first();
        const cost = parseInt($cost.text());

        if (gold < cost) {return;}

        const landmark_name = $(this).parent().parent().find('div.landmark-title>font.name').text();
        const shop_name = $(this).parent().parent().parent().parent().find('div.title').text();
        const index = $(this).index();

        jcmp.CallLocalEvent('buy', landmark_name, shop_name, index, cost);
        $('div.tooltip').hide();

    })

    $(document).on('mousemove', '.item', function(e)
    {
        if ($(this).hasClass('bought')) {return;}

        const $cost = $(this).find('div.price').first();
        const $desc = $('div.tooltip').find('#tooltip-cost-desc').first();
        const cost = parseInt($cost.text());

        if (cost <= gold)
        {
            $desc.text('Click to buy');
        }
        else
        {
            $desc.text('Not enough gold');
        }

        $('div.tooltip').find('span#tooltip-cost').text(cost);
        $('div.tooltip').find('span#tooltip-cost').css('color', cost <= gold ? 'rgb(50,50,50)' : 'red');
        $('div.tooltip').find('.fa').removeClass('fa-bullseye').removeClass('fa-anchor');

        if ($(this).parent().parent().find('div.landmark-title').find('i.fa').hasClass('fa-anchor'))
        {
            $('div.tooltip').find('.fa').addClass('fa-anchor');
        }
        else
        {
            $('div.tooltip').find('.fa').addClass('fa-bullseye');
        }

        $('div.tooltip').find('font.name').text($(this).parent().parent().find('div.landmark-title>font.name').text());

        $('div.tooltip')
            .css({
                'top': e.pageY,
                'left': e.pageX
            })
            .show();
    })

    $(document).on('mouseleave', '*', function(e)
    {
        $('div.tooltip').hide();
    })

    jcmp.AddEvent('toggle_enabled', (enabled) => 
    {
        can_open = !enabled;
    })

    jcmp.AddEvent('add', (data) => 
    {
        setTimeout(() => 
        {
            AddEntry(JSON.parse(data));
        }, 1000);
    })

    jcmp.AddEvent('clear', () => 
    {
        $('div.map-shop div.main-container').empty();
    })

    jcmp.AddEvent('init_bought_maps', (data) => 
    {
        bought_maps = JSON.parse(data);
    })

    jcmp.AddEvent('update_gold', (amt) => 
    {
        gold = amt;

        $('div.price').each(function()
        {
            const cost = parseInt($(this).text());
            if (cost == 0) // If it's free
            {
                $(this).css('color', 'green');
            }
            else if (cost <= gold) // If they have enough gold to purchase it
            {
                $(this).css('color', 'rgb(50,50,50)');
            }
            else
            {
                $(this).css('color', 'red');
            }
        })
    })

    jcmp.AddEvent('buy_map', (data) => 
    {
        data = JSON.parse(data);

        let $container;
        let $item_container;

        $('div.landmark-container>div.landmark-title>font.name').each(function()
        {
            if ($(this).text() == data.landmark_name)
            {
                $container = $(this).parent().parent();
                $item_container = $container.find('div.item-container').first();
            }
        })

        const $item = $item_container.children().eq(data.index);

        $item.addClass('bought');
    })

    jcmp.AddEvent('add_landmark', (data) => 
    {
        data = JSON.parse(data);
        landmark_data[data.name] = data;
    })

    jcmp.AddEvent('set_discovered', (name) => 
    {
        if (!landmark_data[name]) {return;}
        landmark_data[name].discovered = true;
        UpdateKnownLandmarks(name);
    })

    jcmp.AddEvent('buy', (landmark_name, index) => 
    {
        let $container;
        let $item_container;

        $('div.landmark-container>div.landmark-title>font.name').each(function()
        {
            if ($(this).text() == data.landmark_name)
            {
                $container = $(this).parent().parent();
                $item_container = $container.find('div.item-container').first();
            }
        })

        $($item_container).eq(index).addClass('bought');
    })

    jcmp.AddEvent('toggle_mouse', (showing) => 
    {
        if (showing) {jcmp.ShowCursor();} else {jcmp.HideCursor();}
    })

    jcmp.AddEvent('set_name', (name) => 
    {
        $('div.map-shop>div.title').text(name);
    })

    jcmp.CallLocalEvent('ready');
    jcmp.CallEvent('ui_ready', 'shop');

})
