$(document).ready(function() 
{
    $('html').css('visibility', 'visible');

    const open_key = 77; // M
    let open = false;
    let can_open = true;

    const landmarks = {};

    $('div.tooltip').hide();
    $('i.fas.fa-map-marker-alt').hide();

    /**
     * Adds a landmark to the map.
     * @param {*} data - Must contain x, y, name, and discovered
     */
    function AddLandmark(data)
    {
        const size = `${(data.radius / 800) * 3.25}vh`;
        const icon = data.discovered ? data.icon ? data.icon : 'anchor' : 'question';
        const $landmark = $(`<i class='fa fa-${icon} landmark' style='top: ${data.y}%; left: ${data.x}%; font-size: ${size};'></i>`);
        $landmark.data('discovered', data.discovered).data('name', data.name).data('icon', data.icon || 'anchor');
        $('div.container').prepend($landmark);
        landmarks[data.name] = $landmark;
    }

    function AddTreasure(data)
    {
        const $landmark = $(`<i class='fa fa-times landmark' style='top: ${data.y}%; left: ${data.x}%; font-size: 1vh;'></i>`);
        $landmark
            .data('discovered', true)
            .data('name', data.name)
            .data('hint', data.hint)
            .data('landmark-name', data.landmark_name)
            .data('chest-index', data.chest_index);
        $('div.container').append($landmark);
    }

    function UpdateShipPosition(data)
    {
        $('img.myship').css('top', `${data.y}%`);
        $('img.myship').css('left', `${data.x}%`);
    }


    function Open()
    {
        open = true;

        $('body').stop();
        $('body').css('transform', 'rotateX(0deg)');

        const audio = new Audio('open.ogg');
        audio.volume = 0.25;
        audio.play();

        jcmp.ShowCursor();
        jcmp.CallLocalEvent('toggle_map', open);
    }

    function Close()
    {
        open = false;

        $('body').stop();
        $('body').css('transform', 'rotateX(90deg)');
        
        const audio = new Audio('open.ogg');
        audio.volume = 0.25;
        audio.play();

        jcmp.HideCursor();
        jcmp.CallLocalEvent('toggle_map', open);
    }

    
    document.onkeyup = (e) => 
    {
        const keycode = (typeof e.which === 'number') ? e.which : e.keyCode;

        if (keycode == open_key && can_open)
        {
            if (open) {Close();} else {Open();}
        }
    }

    $(document).on('contextmenu', function(e)
    {
        if (!open) {return;}
        if ($('i.fas.fa-map-marker-alt').css('display') == 'none')
        {
            // Not showing, so display it
            $('i.fas.fa-map-marker-alt')
            .css({
                'top': e.pageY - $('div.container').offset().top - $('i.fas.fa-map-marker-alt').height(),
                'left': e.pageX - $('div.container').offset().left - $('i.fas.fa-map-marker-alt').width() / 2,
            })
            .show();

            
            const audio = new Audio('pencil.ogg');
            audio.volume = 0.5;
            audio.play();


            const x = ((parseInt($('i.fas.fa-map-marker-alt').css('left')) + $('i.fas.fa-map-marker-alt').width() / 2) / $('div.container').width()) * 100;
            const z = (($('i.fas.fa-map-marker-alt').offset().top + $('i.fas.fa-map-marker-alt').height()) / $('div.container').height()) * 100;

            jcmp.CallLocalEvent('set_marker', x, z);
        }
        else
        {
            // Showing, so remove it
            $('i.fas.fa-map-marker-alt').hide();

            const audio = new Audio('eraser.ogg');
            audio.volume = 0.5;
            audio.play();
    
            jcmp.CallLocalEvent('hide_marker');
        }
        e.preventDefault();
    })

    $(document).on('mousemove', '.fa-anchor,.fa-question,.fa-times,.fa-bullseye', function(e)
    {
        if (!$(this).data('name')) {return;}

        const name = $(this).data('discovered') ? $(this).data('name') : '???';
        const color = $(this).data('name') == 'Treasure' ? 'rgb(220,0,0)' : 'rgb(50,50,50)';

        const hint = $(this).data('hint');


        $('div.tooltip')
            .empty()
            .text(name)
            .css({
                'top': e.pageY,
                'left': e.pageX,
                'color': color
            })
            .show();

        if (hint)
        {
            $('div.tooltip').append($(`<div class='hint'>${hint}</div>`));
        }
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
        AddLandmark(JSON.parse(data));
    })

    jcmp.AddEvent('update_pos', (data) => 
    {
        UpdateShipPosition(JSON.parse(data));
    })

    jcmp.AddEvent('update_discovered', (name) => 
    {
        landmarks[name].removeClass('fa-question').addClass(`fa-${landmarks[name].data('icon')}`);
        landmarks[name].data('discovered', true);
    })

    jcmp.AddEvent('add_treasure', (data) => 
    {
        AddTreasure(JSON.parse(data));
    })

    jcmp.AddEvent('found_treasure', (data) => 
    {
        data = JSON.parse(data);
        $('i.fa.fa-times.landmark').each(function()
        {
            if ($(this).data('landmark-name') == data.landmark_name && $(this).data('chest-index') == data.chest_index)
            {
                $(this).remove();
                return;
            }
        })
    })

    jcmp.CallLocalEvent('ready');
    jcmp.CallEvent('ui_ready', 'map');

})
