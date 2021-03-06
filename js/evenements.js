/* TO DO :
    Fenetre modale d'aide à l'utilisation : explications, gifs.
    Deviner la taille de clé et l'afficher
*/

// ######################################################################
// ##                     ANIMATIONS HISTOGRAMME                       ##
// ######################################################################



/*
 *  Molette
 */
$('#freq_chart_div').on('wheel mousewheel', function(event) {

    if ($("#cle_trouvee").children().length == 0) {
        return;
    }
    
    // On cherche selon le navigateur, de trouver un attribut de l'evenement intercepté
    // qui nous permet de déterminer le sens du scroll
    var aGauche;
    if (event.originalEvent.wheelDeltaY != undefined) {
        aGauche = (event.originalEvent.wheelDeltaY > 0) ? true : false;
    }
    else if (event.originalEvent.deltaY != undefined) {
        aGauche = (event.originalEvent.deltaY < 0) ? true : false;
    }
    else if (console) {
        console.warn("L'évènement mousewheel est mal supporté sur le navigateur actuellement utilisé");
    }
        
    if ( aGauche ) {
        decalageHistoGaucheAvecApercu();
    }
    else {
        decalageHistoDroiteAvecApercu();
    }

    // On échappe le comportement initial du scroll.
    event.preventDefault();
});


var isHeld = false;
var xInitial;

/*
 *  Clic gauche maintenue
 */
$('#freq_chart_div').on("touchstart mousedown", function(event) {
    if ($( "#cle_trouvee" ).children().length > 0) {
        event.preventDefault();
        isHeld = true;
        xInitial = (event.type == "touchstart") ?
            event.originalEvent.touches[0].clientX : event.originalEvent.clientX;
    }
});

$('#freq_chart_div').on("touchmove mousemove", function(event) {
    if (isHeld && $( "#cle_trouvee" ).children().length > 0) {
        event.preventDefault();

        var xActuel = (event.type == "touchmove") ?
            event.originalEvent.touches[0].clientX : event.originalEvent.clientX;
        var xDiff = xActuel - xInitial;

        if (xDiff > 15) {
            xInitial = xActuel;
            decalageHistoDroiteAvecApercu();
        }
        else if (xDiff < -15) {
            xInitial = xActuel;
            decalageHistoGaucheAvecApercu();
        }
    }
});

$( document ).on("touchend mouseup", function() {
    isHeld = false;
});


/*
 *  Evenement : Clic sur le bouton de gauche au-dessus du graphique
 *  Resultat :
 *       - Décalage de l'histogramme des fréquences du texte à gauche
 *       - Modification du caractère de la clé sur lequel il y a le focus
 *       - Nouvel apercu du decryptage
 */
$('#btn_decalage_gauche').on('click', function() {
    decalageHistoGaucheAvecApercu();
});

/*
 *  Evenement : Clic sur le bouton de droite au-dessus du graphique
 *  Resultat :
 *       - Décalage de l'histogramme des fréquences du texte à droite
 *       - Modification du caractère de la clé sur lequel il y a le focus
 *       - Nouvel apercu du decryptage
 */
$('#btn_decalage_droite').on('click', function() {
    decalageHistoDroiteAvecApercu();
});



// ######################################################################
// ##                    TEXTE CRYPTE A ANALYSER                       ##
// ######################################################################

/*
 *  Evenement : Touche de clavier sur le champ du texte à analyser
 *  Résultat : Vérifier le format du texte, proposer un cryptage si besoin,
 *       et lancer la cryptanalyse (calcul des fréquences) si le texte est bien formaté
 */
$("#cryptedText").on('keyup change', function(event) {
    if (event.type == "keyup" && regex_mobile.test(navigator.userAgent) ) {
        return;
    }
    else if (texteADecrypter == $(this).val()) {
        return;
    }

    texteADecrypter = $(this).val();
    // On recherche s'il y a des caractères illégaux
    var hasError = $(this).val().match(/[^A-Z]/i);
    var reponsePopup = false;

    if ( hasError != null ) {
        reponsePopup = confirm(POPUP_TEXT);
    }

    if (reponsePopup == true) {
        // L'utilisateur souhaite crypter son texte. On interrompt l'analyse
        // et on le redirige vers la fenetre modale.
        $(this).val('');
        $('#cle_trouvee').html('');

        $( "#texteACrypter" ).val(texteADecrypter);
        $( "#modalCryptage" ).modal('show');
    }
    else {
        // Début de la cryptanalyse : nouvelle clé d'une seule lettre si le texte n'est pas vide
        if ( $(this).val() != "" ) {
            $('#cle_trouvee').html('<span id="focusedChar" style="font-weight: bold;">A</span>');

            // Re-nettoyage du texte par précaution
            var cleanedCryptedText = cleanText($(this).val());
            $('#cryptedText').val(cleanedCryptedText);

            $('#resultat_cryptanalyse').prop('disabled', false);
        }
        else {
            $('#cle_trouvee').html('');
            $('#resultat_cryptanalyse').prop('disabled', true);
        }
    }

    calculFrequences();
    recupererEtAfficherFrequences();
    apercuDecryptage();
});


/*
 *  Evenement : Clic sur le bouton d'affichage du résultat
 *  Résultat : Ouverture d'une fenetre modale contenant le texte décrypté avec la clé déterminée par l'utilisateur
 */
$('#modalResultat').on('show.bs.modal', function(event) {
    var cle = "";
    $( "#cle_trouvee" ).children().each(function(){
        cle += $(this).html();
    });

    texteFinal = crypter($( "#cryptedText").val(), cle, false);
    $( "#texteDecrypte" ).val(texteFinal.texte);
    $( "#cleDevinee" ).html(texteFinal.cle);
});



// ######################################################################
// ##                         MODIFICATION CLE                         ##
// ######################################################################



$(".cle_gauche").on('click', function() {
    focusCaracterePrecedent();
    apercuDecryptage();
});

$(".cle_droite").on('click', function() {
    focusCaractereSuivant();
    apercuDecryptage();
});

$(".cle_plus").on('click', function() {
    var tailleCle = $('#cle_trouvee').children().length;
    if (tailleCle >= 1 && tailleCle < $("#cryptedText").val().length ) {
        $('#cle_trouvee').append('<span>A</span>');
        calculFrequences();
        recupererEtAfficherFrequences();
        apercuDecryptage();
    }
});

$(".cle_moins").on('click', function() {
    var cle = $('#cle_trouvee').children();
    if (cle.length > 1) {
        if (cle.last().attr('id') == "focusedChar") {
            focusCaracterePrecedent();
        }
        $('#cle_trouvee').children().last().remove();
        calculFrequences();
        recupererEtAfficherFrequences();
        apercuDecryptage();
    }
});



// ######################################################################
// ##                      NAVIGATION APPLICATION                      ##
// ######################################################################



$( "#goto_part1" ).on("click", function() {
    $("#home").hide(500);

    // On nettoie les champs du module avant de commencer
    $("#input").val('');
    $("#cle1").val('');
    $("#output").val('');

    $("#part1").show(500);
});

$( "#goto_part2" ).on("click", function() {
    $("#home").hide(500);

    // On nettoie les champs du module avant de commencer
    $("#cryptedText").val('').trigger("change");
    $("#cle2").val('');

    $("#part2").show(500);
    // Après affichage, on met en place l'histogramme et on affiche la fenetre
    // modale d'aide s'il s'agit d'une première visite
    setTimeout(function() { 
        freq_chart.draw(freq_data, freq_options);
        $("#icone-info").twinkle(TWINKLE_OPTIONS);
    }, 500);
});

$( ".goto_home" ).on("click", function() {
    $(this).parent().parent().hide(500);
    $("#home").show(500);
});


$( "#menu-langues-appli" ).on("change", function() {
    changeLangue( $(this).val() );
    $(document).charcycle({
        'target': '#titre',
        'speed': 20
    }); 
});


/*
 *  Evenement : Lorsque l'application est totalement chargée par le navigateur
 *  Résultat :
 *       - On initialise l'indice de coincidence théorique (à défaut : français)
 *       - On lance le petit effet sur le titre (charcycle)
 */
$( document ).ready(function() {
    $( "#ic_theorique" ).html( indice_coincidence[text_language] );
    changeLangue( $("#menu-langues-appli").val() );

    $( "#titre" ).css("visibility", "visible");
    $(this).charcycle({
        'target': '#titre',
        'speed': 20
    });
    
    if ( $(document).width() <= 450 ) {
        $( "#petite-largeur" ).show();
    }
});


/*
 *  Evenvement : Redimensionnement de la fenetre
 *  Resultat : Retracer les histogrammes avec les memes données mais avec les nouvelles dimensions
 */
$( window ).resize(function() {
    // TO DO : Modifier la HAUTEUR de l'histogramme par palier (media query) et supprimer les légendes ?
    freq_chart.draw(freq_data, freq_options);
    indice_chart.draw(indice_data, indice_options);

    // Message pour les petits écrans à la page d'accueil
    if ( $(document).width() <= 450 ) {
        $( "#petite-largeur" ).show();
    } else {
        $( "#petite-largeur" ).hide();
    }
});



// ######################################################################
// ##               ACTIONS MODULE CRYPTAGE/DECRYPTAGE                 ##
// ######################################################################



$( "#interrupteur" ).on("click", function() {
    changeLibelleAction();
});

$( "#action1" ).on("click", function(){
    if ( $( "#cle1" ).val() != '' ) {
        var output = crypter(
            $( "#input" ).val(),
            $( "#cle1" ).val(),
            // coché : cryptage, non coché : decryptage
            $( "#interrupteur" ).prop('checked')
        );

        $( "#cle1" ).val(output.cle);
        $( "#output" ).val(output.texte);
    }
});



// ######################################################################
// ##                   ACTIONS MODULE CRYPTANALYSE                    ##
// ######################################################################



/*
 *  Evenement : Nouveau choix de langage du texte à décrypter
 *  Résulat :
 *       - On change l'indice de coincidence théorique
 *       - On redessine l'histogramme des fréquences théoriques
 */
$( "#menu-langues-texte" ).on("change", function() {
    text_language = $(this).val();
    $( "#ic_theorique" ).html( indice_coincidence[text_language] );

    var frequences_theoriques = frequences[text_language];
    for (var i = 0; i < TAILLE_ALPHABET; i++) {
        freq_data.setValue(i, 1, frequences_theoriques[i]);
    }
    freq_chart.draw(freq_data, freq_options);
});


/*
 *  Evenement : On demande le cryptage du texte dans le module de cryptanalyse
 *  Resultat : On remplace le texte par son équivalent crypté,
 *  et on génère un évenement pour lancer l'analyse
 */
$( "#action2" ).on("click", function() {
    if ( $( "#cle2" ).val() != '' ) {
        var output = crypter($( "#texteACrypter" ).val(), $( "#cle2" ).val(), true);
        $( "#cryptedText" ).val(output.texte);

        $( "#modalCryptage" ).modal('hide');
        $( "#cle2" ).val('');
        $( "#texteACrypter" ).val('');
        $( "#cryptedText" ).trigger("change");
    }
});


/*
 *  Evenement : Clic sur le bouton de redémarrage de l'analyse
 *  Résultat : Nouvelle clé -> "A" et recalcul des fréquences
 */
$( "#restart" ).on("click", function() {
    if ( $( "#cryptedText" ).val() != '') {
        $( "#cle_trouvee" ).html('<span id="focusedChar" style="font-weight: bold;">A</span>');
        calculFrequences();
        recupererEtAfficherFrequences();
        apercuDecryptage();
    }
});


/*
 *  Evenement : Clic sur le bouton plus de statistiques
 *  Resultat : Calcul des indices pour des clés de tailles 1 à 20 et affichage dans le graphique
 */
$ ( "#statsPlus" ).on("click", function() {
    calculeIndicesCoincidenceParTaille();
});


/*
 *  Evenement correctif pour un affichage du graphique sur toute la largeur de la fenetre modale.
 */
$('#modalStatsPlus').on('shown.bs.modal', function() {
    indice_chart.draw(indice_data, indice_options);
});


$( "#modalAide" ).on("show.bs.modal", function() {
    $( ".carousel-active" ).removeClass("carousel-active");
    $( ".carousel-div-text *:first-child" ).addClass("carousel-active");
    
    $( "#carrouselAide" ).carousel(0);
});


$( "#carrouselAide" ).on("slid.bs.carousel", function() {
    var index_frame = $( ".carousel-indicators .active" ).index() + 1;

    $( ".carousel-active" ).removeClass("carousel-active");
    $( ".carousel-div-text *:nth-child(" + index_frame + ")" ).addClass("carousel-active");
});


/*$(".slider").slider({
    min : 0,
    max : 25    
}).slider("pips", {
        rest: "label",
        labels: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z']
});*/