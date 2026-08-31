
const nodemailer = require('nodemailer')
const dotenv = require('dotenv')
dotenv.config();

async function sendMail(to, subject, message, caso, form, rutaPdf, rutaCsv){

    console.log(rutaCsv)
    const transporter = nodemailer.createTransport({
        service: "hotmail",
        auth: {
            user: "correosBascula@hotmail.com",
            pass: "Bascula1234",
        }
    })

    const options = {
        from: "correosBascula@hotmail.com",
        to,
        subject,
        text: message,
        attachments: [
            {
                filename: 'Tiquete.pdf',
                path: __dirname + `../../.${rutaPdf}`
            },
            {
                filename: 'Tiquete.csv',
                path: __dirname + `./../.${rutaCsv}`
            }
        ],
        html: `<html xmlns="http://www.w3.org/1999/xhtml">

        <head>
            <meta name="robots" content="noindex, follow">
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="x-apple-disable-message-reformatting">
            <meta name="viewport" content="width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1">
            <title>Newsletter</title>
            <!--[if gte mso 9]>
                <style>
                    .inner-row-table {
                        border: none;
                        width: 600px !important;
                    }
        
                    .newsletter-button-link, .text-element-td {
                        font-family: Arial, sans-serif;
                    }
        
                    li {
                        text-indent:-1em;
                    }
                </style>
            <![endif]-->
            <!--[if (mso)|(mso 16)]>
                <style type="text/css">
                    a {text-decoration: none;}
                </style>
            <![endif]-->
            <style>
                body {
                    margin: 0 !important;
                    padding: 0 !important
                }
        
                p {
                    margin: 0
                }
        
                table {
                    border-collapse: collapse;
                    min-height: 0 !important
                }
        
                td {
                    border-collapse: collapse;
                    white-space: -moz-pre-wrap !important;
                    white-space: -webkit-pre-wrap;
                    white-space: -pre-wrap;
                    white-space: -o-pre-wrap;
                    white-space: pre-wrap;
                    word-wrap: normal;
                    word-break: normal;
                    white-space: normal;
                    border: none !important
                }
        
                .main-table,
                .newsletter-row {
                    width: 100%
                }
        
                .component.text-component a {
                    color: #337ab7;
                    text-decoration: none !important
                }
        
                .component.text-component a:focus,
                .component.text-component a:hover {
                    color: #23527c;
                    text-decoration: underline;
                    outline: 0
                }
        
                @media only screen and (max-width:700px) {
                    #newsletter-tracking-image-id {
                        display: none !important
                    }
        
                    .newsletter-tracking-image-class {
                        display: none !important
                    }
                }
        
                @media only screen and (max-width: 700px) {
                    table {
                        border-collapse: initial;
                    }
        
                    .component .image {
                        mso-line-height-rule: exactly;
                    }
        
                    .component .newsletter-button-link .button {
                        width: auto !important
                    }
        
                    .component,
                    .image table {
                        width: 100% !important
                    }
        
                    .responsive-row .inner-row-table .slot {
                        width: 100% !important;
                        max-width: 100% !important;
                        display: block;
                    }
        
                    .responsive-row .inner-row-table .slot.ONE_FOURTH {
                        width: 50% !important;
                        max-width: 50% !important;
                        display: inline-block
                    }
        
                    .non-responsive .slot.FULL {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
        
                    .non-responsive .slot.ONE_THIRD {
                        width: 33.3% !important;
                        max-width: 33.3% !important;
                    }
        
                    .non-responsive .slot.HALF {
                        width: 50% !important;
                        max-width: 50% !important;
                    }
        
                    .non-responsive .slot.TWO_THIRDS {
                        width: 66.6% !important;
                        max-width: 66.6% !important;
                    }
        
                    .non-responsive .slot.ONE_FOURTH {
                        width: 25% !important;
                        max-width: 25% !important;
                    }
        
                    .fix-android-mail {
                        /*remove width placeholder set due to Android 6.0 client*/
                        display: none;
                    }
        
                    #bg_color_table {
                        width: 100%
                    }
        
                    .slot-spacing {
                        display: none
                    }
        
                    .non-responsive .slot-spacing {
                        display: none;
                    }
        
                    .non-responsive .slot-spacing.CENTER {
                        display: none;
                    }
        
                    .non-responsive .slot {
                        display: table-cell;
                    }
        
                    .non-responsive .slot.FULL .image-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.ONE_THIRD .image-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.HALF .image-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.TWO_THIRDS .image-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.ONE_FOURTH .image-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.FULL .product-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.ONE_THIRD .product-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.HALF .product-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.TWO_THIRDS .product-component img {
                        max-width: 100% !important
                    }
        
                    .non-responsive .slot.ONE_FOURTH .product-component img {
                        max-width: 100% !important
                    }
        
                    .component .image img {
                        max-width: 100% !important
                    }
        
                    .slot.HALF .image img.not-resized {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
        
                    .slot.ONE_THIRD .image img.not-resized {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
        
                    .slot.ONE_FOURTH .image img.not-resized {
                        max-width: 100% !important;
                        width: 100% !important;
                    }
        
                    .row-table-body {
                        width: 100% !important;
                    }
        
                    .product-element-price {
                        width: 50% !important;
                        margin: 0 !important;
                        padding: 10px !important;
                    }
        
                    .inner-row-table {
                        max-width: 600px;
                        width: 100% !important;
                    }
                }
            </style>
        </head>
        
        <body style="padding: 0px; margin: 0px; font-family: arial, sans-serif; background-repeat: no-repeat; background-size: auto; background-color: rgb(107, 103, 79);" border="0" class="notranslate">
            <table align="center" class="wrapper-table" width="100%" height="100%" border="0" cellspacing="0" cellpadding="0" style="background-repeat: no-repeat; background-size: auto; background-color: rgb(107, 103, 79);">
                <tbody>
                    <tr>
                        <td class="wrapper-td" valign="top" align="center" style="background-repeat: no-repeat; background-size: auto; background-color: rgb(107, 103, 79);">
                            <table border="0" cellspacing="0" cellpadding="0" align="center" class="main-table" width="100%">
                                <tbody>
                                    <tr>
                                        <td align="center" class="content">
                                            <table data-structure-type="row" data-row-type="FULL" data-row-id="e9f7bcf0-f032-50cd-b16e-84fe5da78667" data-row-behavior="NORMAL" data-row-repeat-count="5" data-row-sort-products="Orders" data-row-background-color-wide="transparent" cellpadding="0" cellspacing="0" width="100%" class="newsletter-row rowe9f7bcf0 responsive-row" bgcolor="transparent">
                                                <tbody>
                                                    <tr>
                                                        <td class="row-td" align="center">
                                                            <table class="inner-row-table" cellpadding="0" cellspacing="0" width="600" valign="top" bgcolor="transparent" style="background-repeat: no-repeat; background-position: initial; border-radius: 0px;">
                                                                <tbody class="row-table-body" style="display: table; width: 600px;">
                                                                    <tr>
                                                                        <td class="slot slotb9897dac FULL" data-structure-type="slot" data-slot-type="FULL" width="600" cellpadding="0" cellspacing="0" align="left" valign="top" style="font-weight: normal; max-width: 600px; width: 600px; border-radius: 0px; overflow: visible;">
                                                                            <table class="component image-component image2a1465bf" data-component-type="image" data-parent-slot-type="FULL" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: transparent;">
                                                                                <tbody>
                                                                                    <tr class="newsletter-main-content">
                                                                                        <td class="image image-container" align="left" style="line-height: 1px; padding: 0px;"><img src="https://moosendimages.imgix.net/yannis_170111122342178.png?auto=format%2Ccompress&amp;dpr=1&amp;fit=clip&amp;ixjsv=2.2.4&amp;w=600" alt="Email Image" class="newsletter-image " height="auto" width="600" data-resize-width="600" data-resize-height="40" data-original-src="https://cdn.designer-images.net/yannis_170111122342178.png" align="bottom" style="box-sizing: border-box; display: inline-block; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset;"></td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table data-structure-type="row" data-row-type="FULL" data-row-id="217c1b2d-058e-5743-b5e2-cf1c8136ee14" data-row-behavior="NORMAL" data-row-repeat-count="5" data-row-sort-products="Orders" data-row-background-color-wide="transparent" cellpadding="0" cellspacing="0" width="100%" class="newsletter-row row217c1b2d responsive-row" bgcolor="transparent">
                                                <tbody>
                                                    <tr>
                                                        <td class="row-td" align="center">
                                                            <table class="inner-row-table" cellpadding="0" cellspacing="0" width="600" valign="top" bgcolor="transparent" style="background-repeat: no-repeat; background-position: initial; border-radius: 0px;">
                                                                <tbody class="row-table-body" style="display: table; width: 600px;">
                                                                    <tr>
                                                                        <td class="slot slotf50aebf0 FULL" data-structure-type="slot" data-slot-type="FULL" width="600" cellpadding="0" cellspacing="0" align="left" valign="top" style="background-color: rgb(255, 255, 255); font-weight: normal; max-width: 600px; width: 600px; border-radius: 0px; overflow: visible;">
                                                                            <table class="component spacer-component spacer7df4d9fb" data-component-type="spacer" cellspacing="0" cellpadding="0" width="600" align="top" style="background-color: transparent; clear: both; height: 80px; border-width: 0px; border-radius: 0px; border-color: rgb(0, 0, 0); border-style: unset; border-collapse: initial;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td height="80" style="height: 80px;">
                                                                                            <div style="display: none; font-size: 1px;">&nbsp;</div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component text-component text-desktop text099b9443" data-component-type="text" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: transparent;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td class="element-td text-element-td" style="overflow-wrap: break-word; word-break: break-word;">
                                                                                            <div class="text_container newsletter-main-content" style="padding: 10px; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset; color: rgb(0, 0, 0); font-family: Arial, Helvetica, sans-serif, Arial, Helvetica, sans-serif; line-height: 1.3; font-size: 16px;">
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 24px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">${caso == "Transito" ? "Vehículo En Transito" : caso == "Despacho" ? "Despacho De Producto!!" : "Entrada De Materia Prima!!"}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 24px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">${caso == "Transito" ? "" : "Numero De Tiquete:  " + form.noTiquete}</span></span></span></p>
                                                                                                <p class="fix-android-mail" style="max-width: 580px; width: 100%; margin: 0px;"></p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <!--[if gte mso 15]><div style="display: 'none'; font-size: 1px; line-height: 1px;">&nbsp;</div><![endif]-->
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component text-component text-desktop textdfa3317e" data-component-type="text" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: transparent;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td class="element-td text-element-td" style="overflow-wrap: break-word; word-break: break-word;">
                                                                                            <div class="text_container newsletter-main-content" style="padding: 40px; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset; color: rgb(0, 0, 0); font-family: Arial, Helvetica, sans-serif, Arial, Helvetica, sans-serif; line-height: 1.3; font-size: 16px;">
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Placa:  ${form.placa}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Conductor:  ${form.conductor} CC.${form.cedula}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Producto/Materia Prima:  ${form.materiaPrimaProducto}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Planta:  ${form.planta}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Cliente/Proveedor:  ${form.clienteProveedor}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Origen:  ${form.origenDestino}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Origen:  ${form.destino}</span></span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 12px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Transportadora:  ${form.transportadora}</span></span></span></p>

                                                                                                ${caso == "Transito" ? "" : `
                                                                                                <p style="text-align: center; margin: 0px;">&nbsp;</p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="color: rgb(138, 134, 104); font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;"><span style="font-size: 12px;">Fecha peso vacio: ${form.fechaPesoVacio}, Hora peso vacio: ${form.horaPesoVacio}</span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="color: rgb(138, 134, 104); font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;"><span style="font-size: 12px;">Fecha peso Lleno: ${form.fechaPesoLleno}, Hora peso Lleno: ${form.horaPesoLleno}</span></span></p>
                                                                                                `}
                                                                                                <p style="text-align: center; margin: 0px;">&nbsp;</p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="color: rgb(138, 134, 104); font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;"><span style="font-size: 12px;">Bruto: ${form.bruto}</span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="color: rgb(138, 134, 104); font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;"><span style="font-size: 12px;">Tara: ${form.tara}</span></span></p>
                                                                                                <p style="text-align: center; margin: 0px;"><span style="color: rgb(138, 134, 104); font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;"><span style="font-size: 12px;">Neto: ${form.neto}</span></span></p>
                                                                                                <p class="fix-android-mail" style="max-width: 520px; width: 100%; margin: 0px;"></p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <!--[if gte mso 15]><div style="display: 'none'; font-size: 1px; line-height: 1px;">&nbsp;</div><![endif]-->
                                                                                            </div>
                                                                                            <!--[if gte mso 15]><div style="display: none; font-size: 1px; line-height: 1px;">&nbsp;</div><![endif]-->
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component spacer-component spacerddb0bac6" data-component-type="spacer" cellspacing="0" cellpadding="0" width="600" align="top" style="background-color: transparent; clear: both; height: 58px; border-width: 0px; border-radius: 0px; border-color: rgb(0, 0, 0); border-style: unset; border-collapse: initial;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td height="58" style="height: 58px;">
                                                                                            <div style="display: none; font-size: 1px;">&nbsp;</div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component text-component text-desktop textfaabb0ba" data-component-type="text" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: rgb(255, 255, 255);">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td class="element-td text-element-td" style="overflow-wrap: break-word; word-break: break-word;">
                                                                                            <div class="text_container newsletter-main-content" style="padding: 10px; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset; color: rgb(0, 0, 0); font-family: Arial, Helvetica, sans-serif, Arial, Helvetica, sans-serif; line-height: 1.3; font-size: 16px;">
                                                                                                <p style="text-align: center; margin: 0px;"><span style="font-size: 18px;"><span style="color: rgb(138, 134, 104);"><span style="font-family: &quot;Bookman Old Style&quot;, serif, Arial, Helvetica, sans-serif;">Operario: ${form.operario}</span></span></span></p>

                                                                                                <p style="text-align: center; margin: 0px;">&nbsp;</p>
                                                                                                <p class="fix-android-mail" style="max-width: 580px; width: 100%; margin: 0px;"></p>
                                                                                            </div>
                                                                                            <div>
                                                                                                <!--[if gte mso 15]><div style="display: 'none'; font-size: 1px; line-height: 1px;">&nbsp;</div><![endif]-->
                                                                                            </div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component spacer-component spacer034da53e" data-component-type="spacer" cellspacing="0" cellpadding="0" width="600" align="top" style="background-color: transparent; clear: both; height: 80px; border-width: 0px; border-radius: 0px; border-color: rgb(0, 0, 0); border-style: unset; border-collapse: initial;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td height="80" style="height: 80px;">
                                                                                            <div style="display: none; font-size: 1px;">&nbsp;</div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                            <table class="component image-component image2aab06fe" data-component-type="image" data-parent-slot-type="FULL" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: transparent;">
                                                                                <tbody>
                                                                                    <tr class="newsletter-main-content">
                                                                                        <td class="image image-container" align="center" style="line-height: 1px; padding: 0px;"><img src="https://moosendimages.imgix.net/yannis_170111133633911.png?auto=format%2Ccompress&amp;dpr=1&amp;fit=clip&amp;ixjsv=2.2.4&amp;w=352" alt="Email Image" class="newsletter-image " height="auto" width="176" data-resize-width="176" data-resize-height="20" data-original-src="https://cdn.designer-images.net/yannis_170111133633911.png" align="bottom" style="box-sizing: border-box; display: inline-block; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset;"></td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                           
                                                                            
                                                                            <table class="component spacer-component spacerb85fc8f8" data-component-type="spacer" cellspacing="0" cellpadding="0" width="600" align="top" style="background-color: transparent; clear: both; height: 40px; border-width: 0px; border-radius: 0px; border-color: rgb(0, 0, 0); border-style: unset; border-collapse: initial;">
                                                                                <tbody>
                                                                                    <tr>
                                                                                        <td height="40" style="height: 40px;">
                                                                                            <div style="display: none; font-size: 1px;">&nbsp;</div>
                                                                                        </td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <table data-structure-type="row" data-row-type="FULL" data-row-id="cc6995aa-a216-5b87-913a-9d71d6fda38e" data-row-behavior="NORMAL" data-row-repeat-count="5" data-row-sort-products="Orders" data-row-background-color-wide="transparent" cellpadding="0" cellspacing="0" width="100%" class="newsletter-row rowcc6995aa responsive-row" bgcolor="transparent">
                                                <tbody>
                                                    <tr>
                                                        <td class="row-td" align="center">
                                                            <table class="inner-row-table" cellpadding="0" cellspacing="0" width="600" valign="top" bgcolor="#dcdbd0" style="background-repeat: no-repeat; background-position: initial; border-radius: 0px;">
                                                                <tbody class="row-table-body" style="display: table; width: 600px;">
                                                                    <tr>
                                                                        <td class="slot slotcf7db2ed FULL" data-structure-type="slot" data-slot-type="FULL" width="600" cellpadding="0" cellspacing="0" align="left" valign="top" style="font-weight: normal; max-width: 600px; width: 600px; border-radius: 0px; overflow: visible;">
                                                                            <table class="component image-component image67e84b32" data-component-type="image" data-parent-slot-type="FULL" cellspacing="0" cellpadding="0" width="600" style="clear: both; background-color: rgb(107, 103, 79);">
                                                                                <tbody>
                                                                                    <tr class="newsletter-main-content">
                                                                                        <td class="image image-container" align="left" style="line-height: 1px; padding: 0px;"><img src="https://moosendimages.imgix.net/yannis_170111123627529.png?auto=format%2Ccompress&amp;dpr=1&amp;fit=clip&amp;ixjsv=2.2.4&amp;w=600" alt="Email Image" class="newsletter-image not-resized" height="auto" width="600" data-resize-width="0" data-resize-height="0" data-original-src="https://cdn.designer-images.net/yannis_170111123627529.png" align="bottom" style="box-sizing: border-box; display: inline-block; border-width: 0px; border-color: rgb(0, 0, 0); border-radius: 0px; border-style: unset;"></td>
                                                                                    </tr>
                                                                                </tbody>
                                                                            </table>
                                                                        </td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>
        </body>
        
        </html>`
    }

    transporter.sendMail(options, (error, info) => {
        if (error) console.log(error)
        else console.log(info)
    })

}

module.exports = {
    sendMail
}