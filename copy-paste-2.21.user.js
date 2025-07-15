// ==UserScript==
// @name     اركاب نسخ لصق
// @version  2.21
// @description  اداة مساعدة لنسخ البيانات من الاحالات الى منصة اعتماد - بواسطة علي براك
// @author   @alibarrak
// @match    https://referral.moh.gov.sa/*
// @match    https://ercab.etimad.sa/OpenOrders/Order/*
// @require  https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.30.1/moment.min.js
// @require  http://ajax.googleapis.com/ajax/libs/jquery/1.2.6/jquery.js
// @require  https://server2.dev/files/date.utils.js
// @grant    GM.setValue
// @grant    GM.getValue
// ==/UserScript==

var timeout = 5000;
var timeout2 = 1500;

/* name in 4 parts format */
function split_name(name, remove_space=false) {
  if (!name || name == undefined) return null;

  // double spaces to 1
  name = name.replace(/  /g, " ");

  // AL / BIN fix
  name = name.replace(" AL ", " AL_");
  name = name.replace(" Al ", " Al_");
  name = name.replace(" al ", " al_");
  name = name.replace(" ال ", " ال_");
  name = name.replace(" آل ", " آل_");
  //name = name.replace(" BIN ", " BIN_");
  //name = name.replace(" bin ", " bin_");
  //name = name.replace(" بن ", " بن_");
  //name = name.replace(" بنت ", " بنت_");
  
  // remove all occurances .replace(/abc/g, '');
  name = name.replace(/ BIN /g, " ");
  name = name.replace(/ bin /g, " ");
  name = name.replace(/ BINT /g, " ");
  name = name.replace(/ bint /g, " ");
  name = name.replace(/ بن /g, " ");
  name = name.replace(/ ابن /g, " ");
  name = name.replace(/ بنت /g, " ");
  
  name = name.replace(/ ABU /g, " ABU_");
  name = name.replace(/ abu /g, " abu_");
  name = name.replace(/ ABO /g, " ABO_");
  name = name.replace(/ abo /g, " abo_");
  name = name.replace(/ أبو /g, " أبو_");
  name = name.replace(/ ابو /g, " ابو_");
  
  const arr0 = name.split(' ');

  let arr = [];
  let arr_idx = 0;

  // fix abdul with spaces
  for(let i=0; i<arr0.length; i++){
    if(arr0[i]=="عبد"){
      if(arr0[i+1]){
        arr[arr_idx] = arr0[i]+' '+arr0[i+1]; // merge
        i++;
      }
    }
    else{
      arr[arr_idx] = arr0[i];
    }

    arr_idx++;
  }

  if (arr.length == 0) {
    arr.push('');
    arr.push('');
    arr.push('');
    arr.push('');
  } else if (arr.length == 1) {
    arr.push('');
    arr.push('');
    arr.push('');
  } else if (arr.length == 2) {
    // first & last 
    arr = [arr[0], '', '', arr[1]];
  } else if (arr.length == 3) {
    arr = [arr[0], arr[1], '', arr[2]];
  } else if (arr.length == 4) {
    // all good
  } else if (arr.length == 5) {
    arr = [arr[0], arr[1], arr[2]+' '+arr[3], arr[4]];
  } else if (arr.length == 6) {
    arr = [arr[0], arr[1], arr[2]+' '+arr[3], arr[4]+' '+arr[5]];
  }
  else if (arr.length == 7) {
    arr = [arr[0], arr[1]+' '+arr[2], arr[3]+' '+arr[4], arr[5]+' '+arr[6]];
  }
  else if (arr.length == 8) {
    arr = [arr[0]+' '+arr[1], arr[2]+' '+arr[3], arr[4]+' '+arr[5], arr[6]+' '+arr[7]];
  }
  else{
    alert("الاسم طويل جدا"); 
  }
  
  // restore names
  for(i=0; i<arr.length; i++){
    arr[i] = arr[i].replace("_", " ");
  }
  
  // remove \s from last name
  if(remove_space) arr[3] = arr[3].replace(" ", "");

  return arr;
}



/* realtion id */
function get_relation_id(rel){
  if(!rel || rel==undefined) return null;
  
  /* etimad 
  <option value="" selected="selected">إختر صلة القرابة</option> 
  <option value="2">ام</option>
  <option value="4">اخت</option>
  <option value="6">عمه</option>
  <option value="8">خاله</option>
  <option value="10">جده</option>
  <option value="12">ابنه</option>
  <option value="14">زوجه</option>
  */
  
  if(rel=="بنت") rel = "ابنه";
  
  if(rel=="ولد") rel = "ابن";
  
  const rels = ["اب", "ام", "اخ", "اخت", "عم", "عمه", "خال", "خاله", "جد", "جده", "ابن", "ابنه", "زوج", "زوجه"];
  rel = rel.replace("ة", "ه").replace("أ", "ا").replace("إ", "ا");

  let id = rels.indexOf(rel)+1;
  
  return id;
}


/* clean funny chars */
function clean_string(str){
  if(!str || str==undefined) return null;
  
  str = str.replace("ـ", '');
  
  return str;
}

/* fix dob */
function fix_dob(dob){
  if(!dob || dob==undefined) return null;
  
  mydate = dob.split(/[.\/-]/);
  
  if(mydate.length!=3) return null;
  
  var y;
  var m;
  var d;

  // accept yyyy mm dd or dd mm yyyy
  if(mydate[0].length==4){
    y = parseInt(mydate[0]);
    m = mydate[1];//parseInt(mydate[1])*1 > 9 ? mydate[1] : "0"+mydate[1];
    d = mydate[2];//parseInt(mydate[2]) > 9 ? mydate[2] : "0"+mydate[2];
  }
  else if(mydate[2].length==4){
    y = parseInt(mydate[2]);
    m = mydate[1];//parseInt(mydate[1])*1 > 9 ? mydate[1] : "0"+mydate[1];
    d = mydate[0];//parseInt(mydate[0]) > 9 ? mydate[0] : "0"+mydate[0];
  }
  else{
    return "This DOB is not supported!";
  }
  
  var date = y+"-"+m+"-"+d;;
  
  if(y>1900){
    return date;
  }
  else{
    return h2g(date);
  }
}

function inject_btn(){
  $('#copy_').remove();
  
  $('<span valign="top" id="copy_" class="navTabButton"><a href="#" target="_self"><span class="navTabButtonImageContainer" style="width: 37px; text-align: center;font-size: 12px;">نسخ</span></a></span>').insertBefore("#SearchNode");
        
  $('#copy_').click(function(){
    copy_data();
  });
}

if(window.location.href.indexOf("https://referral.moh.gov.sa/") > -1) {
  console.log("referral");
  
  setTimeout(function(){ 
    
    inject_btn();
    
  }, timeout);
  
  $('#crmMasthead').click(function(){
    inject_btn();
  });
}



if(window.location.href.indexOf("https://ercab.etimad.sa/OpenOrders/Order") > -1) {
  setTimeout(function(){ 
    
  console.log("etimad");

    // etimad
    $('body').append('<div id="copy-btn" class="hidden btn-outline-light" style="position: fixed; top: 10px; right: 10px; z-index: 999999;"><button class="btn btn-default btn-sm" id="paste_data"><i class="fa fa-paste"></i> لصق</button></div>');
    
    $("#paste_data").click(function () {
      console.log("paste");
      //console.log(main_array);
      
      
      (async () => {
        let main_array = await GM.getValue('main_array');
        
        
        // get vue variable
        var app = unsafeWindow.app;
        
        var $2 = unsafeWindow.jQuery;
        
        var moment2 = unsafeWindow.moment;

        
        if(window.location.href.indexOf("https://ercab.etimad.sa/OpenOrders/Order/Create") > -1) {

          
          /***********************************************************************
                                           page 0
          ***********************************************************************/
          if($('#createOrderApp > div').eq(1).is(':hidden')){
            alert("البيانات تخص "+ main_array.p0_name_ar[0]+' '+main_array.p0_name_ar[3]);
          }
          
          app.idNumber = main_array.p0_id;
          app.iamBirthDate = main_array.p0_dob[1];


          

          /***********************************************************************
                                           page 1
          ***********************************************************************/
          // R1
          if( !$('#firstNameAr').is(':disabled') && $('#firstNameAr').val()==''){
            $2('#firstNameAr').val(main_array.p0_name_ar[0]);
            app.passengerDetails.firstNameAr = main_array.p0_name_ar[0];
          }
          if( !$('#secondNameAr').is(':disabled') && $('#secondNameAr').val()==''){
            $2('#firstNameAr').val(main_array.p0_name_ar[1]);
            app.passengerDetails.secondNameAr = main_array.p0_name_ar[1];
          }
          if( !$('#thirdNameAr').is(':disabled') && $('#thirdNameAr').val()==''){
            $2('#firstNameAr').val(main_array.p0_name_ar[2]);
            app.passengerDetails.thirdNameAr = main_array.p0_name_ar[2];
          }
          if( !$('#lastNameAr').is(':disabled') && $('#lastNameAr').val()==''){
            $2('#firstNameAr').val(main_array.p0_name_ar[3]);
            app.passengerDetails.lastNameAr = main_array.p0_name_ar[3];
          }

          // R2
          if( !$('#firstNameEn').is(':disabled') && $('#firstNameEn').val()==''){
            $2('#firstNameEn').val(main_array.p0_name_en[0]);
            app.passengerDetails.firstNameEn = main_array.p0_name_en[0];
          }
          if( !$('#secondNameEn').is(':disabled') && $('#secondNameEn').val()==''){
            $2('#firstNameEn').val(main_array.p0_name_en[1]);
            app.passengerDetails.secondNameEn = main_array.p0_name_en[1];
          }
          if( !$('#thirdNameEn').is(':disabled') && $('#thirdNameEn').val()==''){
            $2('#firstNameEn').val(main_array.p0_name_en[2]);
            app.passengerDetails.thirdNameEn = main_array.p0_name_en[2];
          }
          if( !$('#lastNameEn').is(':disabled') && $('#lastNameEn').val()==''){
            $2('#firstNameEn').val(main_array.p0_name_en[3]);
            app.passengerDetails.lastNameEn = main_array.p0_name_en[3];
          }

          // R3
          if( !$('[id^=calendar-control-]').eq(1).is(':disabled') && $('[id^=calendar-control-]').eq(1).val()==''){
            $2('[id^=calendar-control-]').eq(1).val(main_array.p0_dob[1]);
            app.passengerDetails.dateOfBirth = main_array.p0_dob[1];
          }
          if( !$('#checkbox98').is(':disabled') && !$('#checkbox066').is(':disabled') ){
            if(main_array.p0_sex==1){
              app.passengerDetails.genderId = 1;
            }
            else if(main_array.p0_sex==2){
              app.passengerDetails.genderId = 2;
            }
          }
          if( $('#select4').val()=='' || $('#select4').val()=="Manual" ){ // Manual after new update 13-01-2025 (was '')
            //console.log(main_array.p0_marital);
            $2('#select4').val(main_array.p0_marital).change();
            app.passengerDetails.martialStatus = main_array.p0_marital;
          }

          // R4
          if( $('#ddlNationality').val()=='' || $('#ddlNationality').val()==null ){ // null after new update 13-01-2025 (was '')
            $2('#ddlNationality').val("SA").change();
            app.passengerDetails.nationalityId = "SA";
          }

          // R5
          if( !$('#nationalId').is(':disabled') && $('#nationalId').val()==''){
            app.passengerDetails.nationalId = main_array.p0_id;
          }
          if( !$('[id^=calendar-control-]').eq(3).is(':disabled') && $('[id^=calendar-control-]').eq(3).val()==''){
            app.passengerDetails.idExpiryDateString = main_array.p0_id_expiry[1];
          }

          // R6
          if( !$('#phone').is(':disabled') && $('#phone').val()==''){
            app.passengerDetails.contactMobile = main_array.p0_mobile;
          }
          if( !$('#passengerDetailsemail').is(':disabled') && $('#passengerDetailsemail').val()==''){
            app.passengerDetails.contactEmail = main_array.p0_email;
          }
        }
        
        else if(window.location.href.indexOf("https://ercab.etimad.sa/OpenOrders/Order/TripDetails") > -1) {
        /***********************************************************************
                                         page 2
        ***********************************************************************/
					if(!$('#firstView').is(':hidden')){
            // SA = 9
            $2('#orderTypeId').val(9).change();
            app.order.orderTypeId = 9;

            // economy = 3
            $2('#ticketClassId').val(3).change();
            app.order.ticketClassId = 3;

            // demostic = 1
            $2('#internalTrip').attr('checked','checked').change();
            app.order.tripTypeId = 1;

            // from
            //$2('#cityFrom_checkbox').attr('checked','checked').change();

            $('#cityFrom_checkbox').click(function(){
              $2('#cityFromTxt').val(main_array.appt_city_from).change();
              app.cityFrom = main_array.appt_city_from;
            });

            // to
            //$2('#cityTo_checkbox').attr('checked','checked').change();

            $('#cityTo_checkbox').click(function(){
              $2('#citytoTxt').val(main_array.appt_city_to).change();
              app.cityTo = main_array.appt_city_to;
            });


            // period
            // user should click
            $('#customSwitch1').click(function(){
              let today = moment2().format('YYYY-MM-DD');
              let appt_date_30 = moment2(main_array.appt_date[1]).add(1, 'month').format('YYYY-MM-DD');

              app.order.openErcabOrderDetails.intervalGoRetuenDepartureDateFromStr = today;
              app.order.openErcabOrderDetails.intervalGoRetuenDepartureDateToStr = main_array.appt_date[1]
              app.order.openErcabOrderDetails.intervalReturnDepartureDateFromStr = main_array.appt_date[1];
              app.order.openErcabOrderDetails.intervalReturnDepartureDateToStr = appt_date_30;


              // national ID = 2
              app.order.documentType = 2;
            });

            // number of companions 
            let companions = 0;
            if(main_array.p1_id != null) companions++;
            if(main_array.p2_id != null) companions++;


            if(companions==2){
              // child
              if($('#isTicketIssuedByUser:checkbox:checked').length==1) $2('#isTicketIssuedByUser').click();
            }
            else{
              // not child
              //console.log(app.order.bookByBeneficiary); does not work
              if($('#isTicketIssuedByUser:checkbox:checked').length==0) $2('#isTicketIssuedByUser').click();
            }

            // add companions
            if(companions>0){
              if(!app.isAddCompanions) $2('#isAddCompanions').click();
            }
            else{
              if(app.isAddCompanions) $2('#isAddCompanions').click();
            }

            // national ID = 2
            app.order.documentType = 2;
          }
          
          
        /***********************************************************************
                                         page 3
        ***********************************************************************/
					if(!$('#secondView').is(':hidden')){
            // p1
            if($('#secondView').find('.et-accordion').eq(0).find('div').eq(0).text() == ''){

              // R1
              if( main_array.p1_name_ar){
                //$2('#firstNameAr').val(main_array.p1_name_ar[0]);
                app.companion.firstNameAr = main_array.p1_name_ar[0];
              }
              if( main_array.p1_name_ar){
                app.companion.secondNameAr = main_array.p1_name_ar[1];
              }
              if( main_array.p1_name_ar){
                app.companion.thirdNameAr = main_array.p1_name_ar[2];
              }
              if( main_array.p1_name_ar){
                app.companion.lastNameAr = main_array.p1_name_ar[3];
              }

              // R2
              if( main_array.p1_name_en){
                //$2('#firstNameAr').val(main_array.p1_name_ar[0]);
                app.companion.firstNameEn = main_array.p1_name_en[0];
              }
              if( main_array.p1_name_en){
                app.companion.secondNameEn = main_array.p1_name_en[1];
              }
              if( main_array.p1_name_en){
                app.companion.thirdNameEn = main_array.p1_name_en[2];
              }
              if( main_array.p1_name_en){
                app.companion.lastNameEn = main_array.p1_name_en[3];
              }

              // R3
              // dob
              $2('#dateOfBirthStrText').val(main_array.p1_dob[1]).change();
              app.companion.dateOfBirthStr = main_array.p1_dob[1];
              // nationality
              $2('#ddlNationality').val("SA").change();
              app.companion.nationalityId = "SA";

              // R4
              $2('#passportExpirationDateStrText').val('').change();
              
              // R5
              // show ID 
              app.showNationalityIdField = true;

              $2('#nationalId').val(main_array.p1_id).change();
              app.companion.nationalId = main_array.p1_id;

              $2('#idExpiryDateStringStrText').val(main_array.p1_id_expiry[1]).change();
              app.companion.idExpiryDateStringStr = main_array.p1_id_expiry[1];

              // odd is male, even is female
              /*if(main_array.p1_relation_id % 2 == 0){
                // female
                $('#checkbox132').click();
              }
              else{
                // male
                $('#checkbox131').click();
              }*/
              
              // sex
              if(main_array.p1_sex == "ذكر"){
                // male
                $('#checkbox131').click();
              }
              else{
                // female
                $('#checkbox132').click();
              }

              // relationship 
              $2('#ddlRelation').val(main_array.p1_relation_id).change();
              app.companion.relationId = main_array.p1_relation_id;

              // R5
              // ID 
              app.isCompanionSelectionDocumentType = true;
              app.companion.documentType = 2;

            }
            else{
              // p2
              
              if(!main_array.p2_name_ar || !main_array.p2_id){
                alert("لا يوجد مرافق ثاني");
                return 0;
              }
              
              // R1
              if( main_array.p2_name_ar[0]){
                //$2('#firstNameAr').val(main_array.p2_name_ar[0]);
                app.companion.firstNameAr = main_array.p2_name_ar[0];
              }
              if( main_array.p2_name_ar[1]){
                app.companion.secondNameAr = main_array.p2_name_ar[1];
              }
              if( main_array.p2_name_ar[2]){
                app.companion.thirdNameAr = main_array.p2_name_ar[2];
              }
              if( main_array.p2_name_ar[3]){
                app.companion.lastNameAr = main_array.p2_name_ar[3];
              }

              // R2
              if( main_array.p2_name_en[0]){
                //$2('#firstNameAr').val(main_array.p2_name_ar[0]);
                app.companion.firstNameEn = main_array.p2_name_en[0];
              }
              if( main_array.p2_name_en[1]){
                app.companion.secondNameEn = main_array.p2_name_en[1];
              }
              if( main_array.p2_name_en[2]){
                app.companion.thirdNameEn = main_array.p2_name_en[2];
              }
              if( main_array.p2_name_en[3]){
                app.companion.lastNameEn = main_array.p2_name_en[3];
              }

              // R3
              // dob
              $2('#dateOfBirthStrText').val(main_array.p2_dob[1]).change();
              app.companion.dateOfBirthStr = main_array.p2_dob[1];
              // nationality
              $2('#ddlNationality').val("SA").change();
              app.companion.nationalityId = "SA";

              // R4
              // show ID 
              app.showNationalityIdField = true;

              $2('#nationalId').val(main_array.p2_id).change();
              app.companion.nationalId = main_array.p2_id;

              $2('#idExpiryDateStringStrText').val(main_array.p2_id_expiry[1]).change();
              app.companion.idExpiryDateStringStr = main_array.p2_id_expiry[1];

              // odd is male, even is female
              if(main_array.p2_relation_id % 2 == 0){
                // female
                $('#checkbox132').click();
              }
              else{
                // male
                $('#checkbox131').click();
              }

              // relationship 
              $2('#ddlRelation').val(main_array.p2_relation_id).change();
              app.companion.relationId = main_array.p2_relation_id;

              // R5
              // ID 
              app.isCompanionSelectionDocumentType = true;
              app.companion.documentType = 2;
              
            }
          }
          
        }
        
        
      })();
      
    });
    
    }, timeout2);
}


function copy_data(){
  var $ = unsafeWindow.jQuery;
    if($){
      var main_array = null;

      console.log("ready");
      //alert("ready");

      var html = $($('iframe')[0]).contents().find("html").html();
      var p0_name_ar = $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_fullnamear_d').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_fullnamear_d').attr("title").trim() : null;
      var p0_name_en = $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_fullnameen_d').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_fullnameen_d').attr("title").trim() : null;
      var p0_email = $(html).find('#inf_email_d').length ? $(html).find('#inf_email_d').attr("title").trim() : null;

      // p0_dob
      var p0_age = $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_patientage_d').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_patientage_d').attr("title").trim() *1 : null;

      // dob gregorian
      var p0_dob_gregorian = $(html).find('#Patient_Quick_View_Form_Patient_Quick_View_Form_contact_birthdate').length ? $(html).find('#Patient_Quick_View_Form_Patient_Quick_View_Form_contact_birthdate').attr("title").split(" ") : null;
      // dob hijri
      var p0_dob_hijri = $(html).find('#Patient_Quick_View_Form_Patient_Quick_View_Form_contact_inf_dob_hijri_d').length ? $(html).find('#Patient_Quick_View_Form_Patient_Quick_View_Form_contact_inf_dob_hijri_d').attr("title").trim() : null;

      //console.log(p0_dob_gregorian);
      //console.log(p0_dob_hijri);
      //console.log(p0_age);

      var p0_dob = [null, null];
      if(p0_dob_gregorian!=null)
        p0_dob = ['', moment(p0_dob_gregorian[1]+" "+p0_dob_gregorian[2]+" "+p0_dob_gregorian[3], "MMM DD YYYY").format('YYYY-MM-DD')];
      else if(p0_dob_hijri!=null)
        fix_dob(p0_dob_hijri);
      else if(p0_age!=null)
        p0_dob = ['', (moment().format('YYYY')*1 - p0_age) + "-01-01"];

      var p0_id = $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_nationalid_d').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_inf_nationalid_d').attr("title").trim() : null;
      //Patient_Quick_View_Form_Patient_Quick_View_Form_contact_inf_nationalid_d

      var p0_mobile = $(html).find('#patienttraveldetails_patienttraveldetails_contact_mobilephone_d').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_mobilephone_d').attr("title").trim() : null;
      
      if(p0_mobile){
        p0_mobile = "00" + p0_mobile;
      }

      var p0_id_expiry = ['', moment().add(5,'y').format('YYYY-MM-DD')];// lagacy array

      var p0_marital = 2; // MISSING TODO

      var p0_sex = $(html).find('#patienttraveldetails_patienttraveldetails_contact_gendercode').length ? $(html).find('#patienttraveldetails_patienttraveldetails_contact_gendercode').attr("title").trim() : null;
			
      if(p0_sex){
        if(p0_sex=="ذكر") p0_sex = 1;
        else if(p0_sex=="أنثى") p0_sex = 2;
      }


      // appt date
      var arr = $(html).find('#inf_appointmentdate').length ? $(html).find('#inf_appointmentdate').attr("title").split(" ") : null;
      var appt_date = arr ? ['', moment(arr[1]+" "+arr[2]+" "+arr[3], "MMM DD YYYY").format('YYYY-MM-DD')]: [null, null]; // lagacy array



      // escort count
      var escort_count = $(html).find('#inf_escortscount_d').length ? $(html).find('#inf_escortscount_d').attr("title") * 1 : null;



      var appt_city_from =  $(html).find('#inf_departurecity_lookupValue').length ? clean_string($(html).find('#inf_departurecity_lookupValue').attr("title").trim()) : null;

      // sharoorah
      if(appt_city_from && $(html).find('#inf_departureairport_lookupValue').length && $(html).find('#inf_departureairport_lookupValue').attr("title").trim()=="مطار شرورة المحلي")
        appt_city_from = "شرورة";

      var appt_city_to =  $(html).find('#inf_arrivalcity_lookupValue').length ? clean_string($(html).find('#inf_arrivalcity_lookupValue').attr("title").trim()) : null;



      // p1
      var p1_name_ar = null;
      var p1_name_en = null;
      var p1_dob = [null, null];
      var p1_sex = null;
      var p1_relation_id = null;
      var p1_id = null;
      var p1_id_expiry = null;
      var p1_age2dob = null;

      // p2
      var p2_name_ar = null;
      var p2_name_en = null;
      var p2_dob = null;
      var p2_sex = null;
      var p2_relation_id = null;
      var p2_id = null;
      var p2_id_expiry = null;
      var p2_age2dob = null;

      if(escort_count>=1){
        if($(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_fullnamear_d').length){
          var title_ar = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_fullnamear_d').attr("title").trim();
          if(title_ar != "تحديد لإدخال البيانات")
            p1_name_ar = title_ar;
        }

        if($(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_fullnameen_d').length){
          var title_en = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_fullnameen_d').attr("title").trim();
          if(title_en != "تحديد لإدخال البيانات")
            p1_name_en = title_en;
        }

        p1_dob = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_gregorianhijribirthday_d').length ? ['', fix_dob($(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_gregorianhijribirthday_d').attr("title").trim())] : [null, null];
        p1_sex = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_gendercode').length ? $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_gendercode').attr("title").trim() : null;
        p1_relation_id = $(html).find('#escortrelation_escortrelation_inf_associatedescort_inf_relationshipwithpatient_lookupValue').length ? $(html).find('#escortrelation_escortrelation_inf_associatedescort_inf_relationshipwithpatient_lookupValue').attr("title").trim(): null;
        p1_id = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_nationalid_d').length ? $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_nationalid_d').attr("title").trim() : null;
        p1_id_expiry = ['', moment().add(5,'y').format('YYYY-MM-DD')];// lagacy array
        
        
        // estimate dob from age 
        if(p1_dob[1]==null){
          // try age 
     			 var p1_age = $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_patientage_d').length ? $(html).find('#FirstEscortDetails_FirstEscortDetails_contact_inf_patientage_d').attr("title").trim() *1 : null;



          if(p1_age!=null){
            p1_dob = ['', (moment().format('YYYY')*1 - p1_age) + "-07-01"];
            p1_age2dob = "تاريخ ميلاد مرافق 1 تقريبي";
          }
        }

      }

      if(escort_count==2){
        if($(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_fullnamear_d').length){
          var title_ar = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_fullnamear_d').attr("title").trim();
          if(title_ar != "تحديد لإدخال البيانات")
            p2_name_ar = title_ar;
        }

        if($(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_fullnameen_d').length){
          var title_en = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_fullnameen_d').attr("title").trim();
          if(title_en != "تحديد لإدخال البيانات")
            p2_name_en = title_en;
        }

        p2_dob = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_gregorianhijribirthday_d').length ? ['', fix_dob($(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_gregorianhijribirthday_d').attr("title").trim())] : [null, null];
        p2_sex = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_gendercode').length ? $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_gendercode').attr("title").trim() : null;
        p2_relation_id = $(html).find('#escort_escort_inf_associatedescort_inf_relationshipwithpatient_lookupValue').length ? $(html).find('#escort_escort_inf_associatedescort_inf_relationshipwithpatient_lookupValue').attr("title").trim(): null;
        p2_id = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_nationalid_d').length ? $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_nationalid_d').attr("title").trim() : null;
        p2_id_expiry = ['', moment().add(5,'y').format('YYYY-MM-DD')];// lagacy array
        
        
        // estimate dob from age 
        if(p2_dob[1]==null){
          // try age 
     			 var p2_age = $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_patientage_d').length ? $(html).find('#SecondEscortDetails_SecondEscortDetails_contact_inf_patientage_d').attr("title").trim() *1 : null;



          if(p2_age!=null){
            p2_dob = ['', (moment().format('YYYY')*1 - p2_age) + "-07-01"];
            p2_age2dob = "تاريخ ميلاد مرافق 2 تقريبي";
          }
        }

      }

      main_array = {
        "p0_name_ar": split_name(p0_name_ar),
        "p0_name_en": split_name(p0_name_en, true),
        "p0_dob": p0_dob,
        "p0_id": p0_id,
        "p0_id_expiry": p0_id_expiry,
        "p0_email": p0_email,
        "p0_marital": p0_marital, //get_marital_id(data_array[0][7]),
        "p0_mobile": p0_mobile,
        "p0_sex": p0_sex,

        "appt_date": appt_date,

        "appt_city_from": appt_city_from,
        "appt_city_to": appt_city_to,

        "p1_name_ar": split_name(p1_name_ar),
        "p1_name_en": split_name(p1_name_en, true),
        "p1_dob": p1_dob,
        "p1_relation_id": get_relation_id(p1_relation_id),
        "p1_id": p1_id,
        "p1_id_expiry": p1_id_expiry,
        "p1_sex": p1_sex,

        "p2_name_ar": split_name(p2_name_ar),
        "p2_name_en": split_name(p2_name_en, true),
        "p2_dob": p2_dob,
        "p2_relation_id": get_relation_id(p2_relation_id),
        "p2_id": p2_id,
        "p2_id_expiry": p2_id_expiry,
        "p2_sex": p2_sex,
      };


      if(!main_array.p0_name_ar){
        alert("لا توجد بيانات للنسخ");
        main_array = null;
      }
      else{
        var error = "";
        if(escort_count>=1 && (!p1_dob[1] || !p1_id || !p1_name_ar || !p1_name_en) )
          error += "\n\nبيانات المرافق 1 غير مكتملة";
        
        if(escort_count==2 && (!p2_dob[1] || !p2_id || !p2_name_ar || !p2_name_en) )
          error += "\n\nبيانات المرافق 2 غير مكتملة";
        
        // age2dob
        if(p1_age2dob!=null)
          error += "\n\n" + p1_age2dob;
        
        if(p2_age2dob!=null)
          error += "\n\n" + p2_age2dob;

        alert("تم نسخ "+ main_array.p0_name_ar[0]+' '+main_array.p0_name_ar[3] + error);
      }


      GM.setValue("main_array", main_array);
      console.log(main_array);
      
    }
}