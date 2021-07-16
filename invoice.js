//Required External Modules :
var express = require("express");
var path = require("path");
var fs = require("fs");
var puppeteer = require("puppeteer");
var handlebars = require("handlebars");



//App Variables :
var app = express();
var port = process.env.PORT || "8000";



//App Configuration :
app.use(express.json()) // for parsing application/json
app.use(express.urlencoded({ extended: true }))



//Routes Definitions :
app.post("/invoice-generator", async(req, res)=>{

    //Taking Input Body :
    const {invoice_name, description, bill_to, ship_to, date, payment_terms, due_date, balence_due, items, tax, amount_paid, notes, terms} = req.body; //all feilds input body must be string.
    
    /*ITEMS is an Array of json :
    item, quantity, rate, amount must be mentioned in json,
    
    example:
    items = [
        {
            "item": "car",
            "quantity": "2",
            "rate": "20",
            "amount": "20,000"
        }
    ]
    you can add multiple json objects in this array
    */

    //Calculating Sub total :
    sub_total = 0;
    for (i in items) {
        sub_total += parseFloat(items[i].amount);
    }
    sub_total = String(sub_total);

    //Calculating grand total :
    tax_amount =  (parseFloat(tax)*parseFloat(sub_total))/100;
    grand_total = (tax_amount + parseFloat(sub_total)).toFixed(2);

    //Creating Json from given Body :
    const invoice_data = {
        invoice_name,
        description,
        bill_to,
        ship_to,
        date,
        payment_terms,
        due_date,
        balence_due,
        items,
        sub_total,
        tax,
        grand_total,
        amount_paid,
        notes,
        terms
    }

    //Reading HTML file :
    var templateHtml = fs.readFileSync(path.join(process.cwd(), "invoice.html"), "utf-8");

    //Assigning values to HTML :
    var template = handlebars.compile(templateHtml);
    var finalHtml = encodeURIComponent(template(invoice_data));

    //Format of our pdf
    var options = {
        format: "A3",
        printBackground: true,
        path: invoice_name+".pdf"
    }

    //Launching Browser :
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    //Launching our HTML page :
    await page.goto(`data:text/html;charset=UTF-8,${finalHtml}`, {
        waitUntil: "networkidle0"
    });

    //Creating PDF with our format :
    await page.pdf(options);

    //Closing Browser :
    await browser.close();

    //Response :
    res.status(200).json({
        "message": "invoice pdf is created!",
        "data": invoice_data
    })
});



//Server Activation :
app.listen(port, () => {
    console.log(`Listening to requests on http://localhost:${port}`);
});
