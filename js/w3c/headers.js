/*jshint
    forin: false
*/
/*global Handlebars*/

// Module w3c/headers
// Generate the headers material based on the provided configuration.
// CONFIGURATION
//  - specStatus: the short code for the specification's maturity level or type (required)
//  - shortName: the small name that is used after /TR/ in published reports (required)
//  - editors: an array of people editing the document (at least one is required). People
//      are defined using:
//          - name: the person's name (required)
//          - url: URI for the person's home page
//          - company: the person's company
//          - companyURL: the URI for the person's company
//          - mailto: the person's email
//          - note: a note on the person (e.g. former editor)
//  - authors: an array of people who are contributing authors of the document.
//  - subtitle: a subtitle for the specification
//  - publishDate: the date to use for the publication, default to document.lastModified, and
//      failing that to now. The format is YYYY-MM-DD or a Date object.
//  - previousPublishDate: the date on which the previous version was published.
//  - previousMaturity: the specStatus of the previous version
//  - errata: the URI of the errata document, if any
//  - alternateFormats: a list of alternate formats for the document, each of which being
//      defined by:
//          - uri: the URI to the alternate
//          - label: a label for the alternate
//          - lang: optional language
//          - type: optional MIME type
//  - logos: a list of logos to use instead of the W3C logo, each of which being defined by:
//          - src: the URI to the logo (target of <img src=>)
//          - alt: alternate text for the image (<img alt=>), defaults to "Logo" or "Logo 1", "Logo 2", ...
//            if src is not specified, this is the text of the "logo"
//          - height: optional height of the logo (<img height=>)
//          - width: optional width of the logo (<img width=>)
//          - url: the URI to the organization represented by the logo (target of <a href=>)
//          - id: optional id for the logo, permits custom CSS (wraps logo in <span id=>)
//          - each logo element must specifiy either src or alt
//  - testSuiteURI: the URI to the test suite, if any
//  - implementationReportURI: the URI to the implementation report, if any
//  - bugTracker: and object with the following details
//      - open: pointer to the list of open bugs
//      - new: pointer to where to raise new bugs
//  - noRecTrack: set to true if this document is not intended to be on the Recommendation track
//  - edDraftURI: the URI of the Editor's Draft for this document, if any. Required if
//      specStatus is set to "ED".
//  - additionalCopyrightHolders: a copyright owner in addition to W3C (or the only one if specStatus
//      is unofficial)
//  - overrideCopyright: provides markup to completely override the copyright
//  - copyrightStart: the year from which the copyright starts running
//  - prevED: the URI of the previous Editor's Draft if it has moved
//  - prevRecShortname: the short name of the previous Recommendation, if the name has changed
//  - prevRecURI: the URI of the previous Recommendation if not directly generated from
//    prevRecShortname.
//  - wg: the name of the WG in charge of the document. This may be an array in which case wgURI
//      and wgPatentURI need to be arrays as well, of the same length and in the same order
//  - wgURI: the URI to the group's page, or an array of such
//  - wgPatentURI: the URI to the group's patent information page, or an array of such. NOTE: this
//      is VERY IMPORTANT information to provide and get right, do not just paste this without checking
//      that you're doing it right
//  - wgPublicList: the name of the mailing list where discussion takes place. Note that this cannot
//      be an array as it is assumed that there is a single list to discuss the document, even if it
//      is handled by multiple groups
//  - charterDisclosureURI: used for IGs (when publishing IG-NOTEs) to provide a link to the IPR commitment
//      defined in their charter.
//  - addPatentNote: used to add patent-related information to the SotD, for instance if there's an open
//      PAG on the document.
//  - thisVersion: the URI to the dated current version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - latestVersion: the URI to the latest (undated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - prevVersion: the URI to the previous (dated) version of the specification. ONLY ever use this for CG/BG
//      documents, for all others it is autogenerated.
//  - subjectPrefix: the string that is expected to be used as a subject prefix when posting to the mailing
//      list of the group.
//  - otherLinks: an array of other links that you might want in the header (e.g., link github, twitter, etc).
//         Example of usage: [{key: "foo", href:"http://b"}, {key: "bar", href:"http://"}].
//         Allowed values are:
//          - key: the key for the <dt> (e.g., "Bug Tracker"). Required.
//          - value: The value that will appear in the <dd> (e.g., "GitHub"). Optional.
//          - href: a URL for the value (e.g., "http://foo.com/issues"). Optional.
//          - class: a string representing CSS classes. Optional.
//  - license: can be one of the following
//      - "w3c", currently the default (restrictive) license
//      - "cc-by", which is experimentally available in some groups (but likely to be phased out).
//          Note that this is a dual licensing regime.
//      - "cc0", an extremely permissive license. This only works with the webspecs specStatus,
//          and it is only recommended if you are working on a document that is intended to be
//          pushed to the WHATWG
//      - "w3c-software", a permissive and attributions license (but GPL-compatible). This is only
//          available with webspecs and is the recommended value. It is the default for webspecs.

define(
    [
        "handlebars"
    ,   "core/utils"
    ,   "tmpl!w3c/templates/headers.html"
    ,   "tmpl!w3c/templates/sotd.html"
    ,   "tmpl!w3c/templates/cgbg-headers.html"
    ,   "tmpl!w3c/templates/cgbg-sotd.html"
    ,   "tmpl!w3c/templates/webspecs-headers.html"
    ],
    function (hb, utils, headersTmpl, sotdTmpl, cgbgHeadersTmpl, cgbgSotdTmpl, wsHeadersTmpl) {
        Handlebars.registerHelper("showPeople", function (name, items) {
            // stuff to handle RDFa
            var re = "", rp = "", rm = "", rn = "", rwu = "", rpu = "", bn = "",
            editorid = "";
            if (this.doRDFa) {
                if (name === "Editor") {
                    bn = "_:editor0";
                    re = " property='bibo:editor' resource='" + bn + "'";
                    rp = " property='rdf:first' typeof='foaf:Person'";
                }
                else if (name === "Author") {
                    rp = " property='dc:contributor' typeof='foaf:Person'";
                }
                rn = " property='foaf:name'";
                rm = " property='foaf:mbox'";
                rwu = " property='foaf:workplaceHomepage'";
                rpu = " property='foaf:homepage'";
            }
            var ret = "";
            for (var i = 0, n = items.length; i < n; i++) {
                var p = items[i];
                if (p.w3cid) {
                    editorid = " data-editor-id='" + parseInt(p.w3cid, 10) + "'";
                }
                if (this.doRDFa) {
                  ret += "<dd class='p-author h-card vcard' " + re + editorid + "><span" + rp + ">";
                  if (name === "Editor") {
                    // Update to next sequence in rdf:List
                    bn = (i < n - 1) ? ("_:editor" + (i + 1)) : "rdf:nil";
                    re = " resource='" + bn + "'";
                  }
                } else {
                  ret += "<dd class='p-author h-card vcard'" + editorid + ">";
                }
                if (p.url) {
                    if (this.doRDFa) {
                        ret += "<meta" + rn + " content='" + p.name + "'><a class='u-url url p-name fn' " + rpu + " href='" + p.url + "'>" + p.name + "</a>";
                    }
                    else ret += "<a class='u-url url p-name fn' href='" + p.url + "'>" + p.name + "</a>";
                }
                else {
                    ret += "<span" + rn + " class='p-name fn'>" + p.name + "</span>";
                }
                if (p.company) {
                    ret += ", ";
                    if (p.companyURL) ret += "<a" + rwu + " class='p-org org h-org h-card' href='" + p.companyURL + "'>" + p.company + "</a>";
                    else ret += p.company;
                }
                if (p.mailto) {
                    ret += ", <span class='ed_mailto'><a class='u-email email' " + rm + " href='mailto:" + p.mailto + "'>" + p.mailto + "</a></span>";
                }
                if (p.note) ret += " (" + p.note + ")";
                if (this.doRDFa) {
                  ret += "</span>\n";
                  if (name === "Editor") ret += "<span property='rdf:rest' resource='" + bn + "'></span>\n";
                }
                ret += "</dd>\n";
            }
            return new Handlebars.SafeString(ret);
        });

        Handlebars.registerHelper("showLogos", function (items) {
            var ret = "<p>";
            for (var i = 0, n = items.length; i < n; i++) {
                var p = items[i];
                if (p.url) ret += "<a href='" + p.url + "'>";
                if (p.id)  ret += "<span id='" + p.id + "'>";
                if (p.src) {
                    ret += "<img src='" + p.src + "'";
                    if (p.width)  ret += " width='" + p.width + "'";
                    if (p.height) ret += " height='" + p.height + "'";
                    if (p.alt) ret += " alt='" + p.alt + "'";
                    else if (items.length == 1) ret += " alt='Logo'";
                    else ret += " alt='Logo " + (i + 1) + "'";
                    ret += ">";
                }
                else if (p.alt) ret += p.alt;
                if (p.url) ret += "</a>";
                if (p.id) ret += "</span>";
            }
            ret += "</p>";
            return new Handlebars.SafeString(ret);
        });

        return {
            status2maturity:    {
                FPWD:           "WD"
            ,   LC:             "WD"
            ,   FPLC:           "WD"
            ,   "FPWD-NOTE":    "NOTE"
            ,   "WD-NOTE":      "WD"
            ,   "LC-NOTE":      "LC"
            ,   "IG-NOTE":      "NOTE"
            ,   "WG-NOTE":      "NOTE"
            }
        ,   status2rdf: {
                NOTE:           "w3p:NOTE",
                WD:             "w3p:WD",
                LC:             "w3p:LastCall",
                CR:             "w3p:CR",
                PR:             "w3p:PR",
                REC:            "w3p:REC",
                PER:            "w3p:PER",
                RSCND:          "w3p:RSCND"
            }
        ,   status2text: {
                NOTE:           "Working Group Note"
            ,   "WG-NOTE":      "Working Group Note"
            ,   "CG-NOTE":      "Co-ordination Group Note"
            ,   "IG-NOTE":      "Interest Group Note"
            ,   "Member-SUBM":  "Member Submission"
            ,   "Team-SUBM":    "Team Submission"
            ,   MO:             "Member-Only Document"
            ,   ED:             "Editor's Draft"
            ,   FPWD:           "First Public Working Draft"
            ,   WD:             "Working Draft"
            ,   "FPWD-NOTE":    "Working Group Note"
            ,   "WD-NOTE":      "Working Draft"
            ,   "LC-NOTE":      "Working Draft"
            ,   FPLC:           "First Public and Last Call Working Draft"
            ,   LC:             "Last Call Working Draft"
            ,   CR:             "Candidate Recommendation"
            ,   PR:             "Proposed Recommendation"
            ,   PER:            "Proposed Edited Recommendation"
            ,   REC:            "Recommendation"
            ,   RSCND:          "Rescinded Recommendation"
            ,   unofficial:     "Unofficial Draft"
            ,   base:           "Document"
            ,   finding:        "TAG Finding"
            ,   "draft-finding": "Draft TAG Finding"
            ,   "CG-DRAFT":     "Draft Community Group Report"
            ,   "CG-FINAL":     "Final Community Group Report"
            ,   "BG-DRAFT":     "Draft Business Group Report"
            ,   "BG-FINAL":     "Final Business Group Report"
            }
        ,   status2long:    {
                "FPWD-NOTE":    "First Public Working Group Note"
            ,   "LC-NOTE":      "Last Call Working Draft"
            }
        ,   recTrackStatus: ["FPWD", "WD", "FPLC", "LC", "CR", "PR", "PER", "REC"]
        ,   noTrackStatus:  ["MO", "unofficial", "base", "finding", "draft-finding", "CG-DRAFT", "CG-FINAL", "BG-DRAFT", "BG-FINAL", "webspec"]
        ,   cgbg:           ["CG-DRAFT", "CG-FINAL", "BG-DRAFT", "BG-FINAL"]
        ,   precededByAn:   ["ED", "IG-NOTE"]
        ,   licenses: {
                cc0:    {
                    name:   "Creative Commons 0 Public Domain Dedication"
                ,   short:  "CC0"
                ,   url:    "http://creativecommons.org/publicdomain/zero/1.0/"
                }
            ,   "w3c-software": {
                    name:   "W3C Software Notice and License"
                ,   short:  "W3C"
                ,   url:    "http://www.w3.org/Consortium/Legal/2002/copyright-software-20021231"
                }
            ,   "cc-by": {
                    name:   "Creative Commons Attribution 4.0 International Public License"
                ,   short:  "CC-BY"
                ,   url:    "http://creativecommons.org/licenses/by/4.0/legalcode"
                }
            }
        ,   run:    function (conf, doc, cb, msg) {
                msg.pub("start", "w3c/headers");

                // Default include RDFa document metadata
                if (conf.doRDFa === undefined) conf.doRDFa = true;
                // validate configuration and derive new configuration values
                if (!conf.license) conf.license = (conf.specStatus === "webspec") ? "w3c-software" : "w3c";
                conf.isCCBY = conf.license === "cc-by";
                if (conf.specStatus === "webspec" && !$.inArray(conf.license, ["cc0", "w3c-software"]))
                    msg.pub("error", "You cannot use that license with WebSpecs.");
                if (conf.specStatus !== "webspec" && !$.inArray(conf.license, ["cc-by", "w3c"]))
                    msg.pub("error", "You cannot use that license with that type of document.");
                conf.licenseInfo = this.licenses[conf.license];
                conf.isCGBG = $.inArray(conf.specStatus, this.cgbg) >= 0;
                conf.isCGFinal = conf.isCGBG && /G-FINAL$/.test(conf.specStatus);
                conf.isBasic = (conf.specStatus === "base");
                conf.isWebSpec = (conf.specStatus === "webspec");
                conf.isRegular = (!conf.isCGBG && !conf.isBasic && !conf.isWebSpec);
                if (!conf.specStatus) msg.pub("error", "Missing required configuration: specStatus");
                if (conf.isRegular && !conf.shortName) msg.pub("error", "Missing required configuration: shortName");
                if (conf.isWebSpec && !conf.repository) msg.pub("error", "Missing required configuration: repository (as in 'darobin/respec')");
                conf.title = doc.title || "No Title";
                if (!conf.subtitle) conf.subtitle = "";
                if (!conf.publishDate) {
                    conf.publishDate = utils.parseLastModified(doc.lastModified);
                }
                else {
                    if (!(conf.publishDate instanceof Date)) conf.publishDate = utils.parseSimpleDate(conf.publishDate);
                }
                conf.publishYear = conf.publishDate.getFullYear();
                conf.publishHumanDate = utils.humanDate(conf.publishDate);
                conf.isNoTrack = $.inArray(conf.specStatus, this.noTrackStatus) >= 0;
                conf.isRecTrack = conf.noRecTrack ? false : $.inArray(conf.specStatus, this.recTrackStatus) >= 0;
                conf.isMemberSubmission = conf.specStatus === "Member-SUBM";
                conf.isTeamSubmission = conf.specStatus === "Team-SUBM";
                conf.isSubmission = conf.isMemberSubmission || conf.isTeamSubmission;
                conf.anOrA = $.inArray(conf.specStatus, this.precededByAn) >= 0 ? "an" : "a";
                conf.isTagFinding = conf.specStatus === "finding" || conf.specStatus === "draft-finding";
                if (!conf.edDraftURI) {
                    conf.edDraftURI = "";
                    if (conf.specStatus === "ED") msg.pub("warn", "Editor's Drafts should set edDraftURI.");
                }
                conf.maturity = (this.status2maturity[conf.specStatus]) ? this.status2maturity[conf.specStatus] : conf.specStatus;
                var publishSpace = "TR";
                if (conf.specStatus === "Member-SUBM") publishSpace = "Submission";
                else if (conf.specStatus === "Team-SUBM") publishSpace = "TeamSubmission";
                if (conf.isRegular) conf.thisVersion =  "http://www.w3.org/" + publishSpace + "/" +
                                                          conf.publishDate.getFullYear() + "/" +
                                                          conf.maturity + "-" + conf.shortName + "-" +
                                                          utils.concatDate(conf.publishDate) + "/";
                if (conf.specStatus === "ED") conf.thisVersion = conf.edDraftURI;
                if (conf.isRegular) conf.latestVersion = "http://www.w3.org/" + publishSpace + "/" + conf.shortName + "/";
                if (conf.isTagFinding) {
                    conf.latestVersion = "http://www.w3.org/2001/tag/doc/" + conf.shortName;
                    conf.thisVersion = conf.latestVersion + "-" + utils.concatDate(conf.publishDate, "-");
                }
                if (conf.previousPublishDate) {
                    if (!conf.previousMaturity && !conf.isTagFinding)
                        msg.pub("error", "previousPublishDate is set, but not previousMaturity");
                    if (!(conf.previousPublishDate instanceof Date))
                        conf.previousPublishDate = utils.parseSimpleDate(conf.previousPublishDate);
                    var pmat = (this.status2maturity[conf.previousMaturity]) ? this.status2maturity[conf.previousMaturity] :
                                                                               conf.previousMaturity;
                    if (conf.isTagFinding) {
                        conf.prevVersion = conf.latestVersion + "-" + utils.concatDate(conf.previousPublishDate, "-");
                    }
                    else if (conf.isCGBG) {
                        conf.prevVersion = conf.prevVersion || "";
                    }
                    else if (conf.isBasic || conf.isWebSpec) {
                        conf.prevVersion = "";
                    }
                    else {
                        conf.prevVersion = "http://www.w3.org/TR/" + conf.previousPublishDate.getFullYear() + "/" + pmat + "-" +
                                           conf.shortName + "-" + utils.concatDate(conf.previousPublishDate) + "/";
                    }
                }
                else {
                    if (!/NOTE$/.test(conf.specStatus) && conf.specStatus !== "FPWD" && conf.specStatus !== "FPLC" && conf.specStatus !== "ED" && !conf.noRecTrack && !conf.isNoTrack && !conf.isSubmission)
                        msg.pub("error", "Document on track but no previous version.");
                    if (!conf.prevVersion) conf.prevVersion = "";
                }
                if (conf.prevRecShortname && !conf.prevRecURI) conf.prevRecURI = "http://www.w3.org/TR/" + conf.prevRecShortname;
                if (!conf.editors || conf.editors.length === 0) msg.pub("error", "At least one editor is required");
                var peopCheck = function (i, it) {
                    if (!it.name) msg.pub("error", "All authors and editors must have a name.");
                };
                $.each(conf.editors, peopCheck);
                $.each(conf.authors || [], peopCheck);
                conf.multipleEditors = conf.editors.length > 1;
                conf.multipleAuthors = conf.authors && conf.authors.length > 1;
                $.each(conf.alternateFormats || [], function (i, it) {
                    if (!it.uri || !it.label) msg.pub("error", "All alternate formats must have a uri and a label.");
                });
                conf.multipleAlternates = conf.alternateFormats && conf.alternateFormats.length > 1;
                conf.alternatesHTML = utils.joinAnd(conf.alternateFormats, function (alt) {
                    var optional = (alt.hasOwnProperty("lang") && alt.lang) ? " hreflang='" + alt.lang + "'" : "";
                    optional += (alt.hasOwnProperty("type") && alt.type) ? " type='" + alt.type + "'" : "";
                    return "<a rel='alternate' href='" + alt.uri + "'" + optional + ">" + alt.label + "</a>";
                });
                if (conf.bugTracker) {
                    if (conf.bugTracker["new"] && conf.bugTracker.open) {
                        conf.bugTrackerHTML = "<a href='" + conf.bugTracker["new"] + "'>" + conf.l10n.file_a_bug + "</a> " +
                                              conf.l10n.open_parens + "<a href='" + conf.bugTracker.open + "'>" +
                                              conf.l10n.open_bugs + "</a>" + conf.l10n.close_parens;
                    }
                    else if (conf.bugTracker.open) {
                        conf.bugTrackerHTML = "<a href='" + conf.bugTracker.open + "'>open bugs</a>";
                    }
                    else if (conf.bugTracker["new"]) {
                        conf.bugTrackerHTML = "<a href='" + conf.bugTracker["new"] + "'>file a bug</a>";
                    }
                }
                if (conf.copyrightStart && conf.copyrightStart == conf.publishYear) conf.copyrightStart = "";
                for (var k in this.status2text) {
                    if (this.status2long[k]) continue;
                    this.status2long[k] = this.status2text[k];
                }
                conf.longStatus = this.status2long[conf.specStatus];
                conf.textStatus = this.status2text[conf.specStatus];
                if (this.status2rdf[conf.specStatus]) {
                    conf.rdfStatus = this.status2rdf[conf.specStatus];
                }
                conf.showThisVersion =  (!conf.isNoTrack || conf.isTagFinding);
                conf.showPreviousVersion = (conf.specStatus !== "FPWD" && conf.specStatus !== "FPLC" && conf.specStatus !== "ED" && !conf.isNoTrack && !conf.isSubmission);
                if (/NOTE$/.test(conf.specStatus) && !conf.prevVersion) conf.showPreviousVersion = false;
                if (conf.isTagFinding) conf.showPreviousVersion = conf.previousPublishDate ? true : false;
                conf.notYetRec = (conf.isRecTrack && conf.specStatus !== "REC");
                conf.isRec = (conf.isRecTrack && conf.specStatus === "REC");
                if (conf.isRec && !conf.errata)
                    msg.pub("error", "Recommendations must have an errata link.");
                conf.notRec = (conf.specStatus !== "REC");
                conf.isUnofficial = conf.specStatus === "unofficial";
                conf.prependW3C = !conf.isUnofficial;
                conf.isED = (conf.specStatus === "ED");
                conf.isLC = (conf.specStatus === "LC" || conf.specStatus === "FPLC");
                conf.isCR = (conf.specStatus === "CR");
                conf.isPR = (conf.specStatus === "PR");
                conf.isPER = (conf.specStatus === "PER");
                conf.isMO = (conf.specStatus === "MO");
                conf.isIGNote = (conf.specStatus === "IG-NOTE");
                conf.dashDate = utils.concatDate(conf.publishDate, "-");
                conf.publishISODate = utils.isoDate(conf.publishDate);
                conf.shortISODate = conf.publishISODate.replace(/T.*/, "");
                conf.processVersion = conf.processVersion || "2015";
                if (conf.processVersion == "2014") {
                    msg.pub("warn", "Process " + conf.processVersion + " has been superceded by Process 2015.");
                    conf.processVersion = "2015";
                }
                conf.isNewProcess = conf.processVersion == "2015";
                // configuration done - yay!

                // annotate html element with RFDa
                if (conf.doRDFa) {
                    if (conf.rdfStatus) $("html").attr("typeof", "bibo:Document " + conf.rdfStatus );
                    else $("html").attr("typeof", "bibo:Document ");
                    var prefixes = "bibo: http://purl.org/ontology/bibo/ w3p: http://www.w3.org/2001/02pd/rec54#";
                    $("html").attr("prefix", prefixes);
                    $("html>head").prepend($("<meta lang='' property='dc:language' content='en'>"));
                }
                // insert into document and mark with microformat
                var bp;
                if (conf.isCGBG) bp = cgbgHeadersTmpl(conf);
                else if (conf.isWebSpec) bp = wsHeadersTmpl(conf);
                else bp = headersTmpl(conf);
                $("body", doc).prepend($(bp)).addClass("h-entry");

                // handle SotD
                var $sotd = $("#sotd");
                if ((conf.isCGBG || !conf.isNoTrack || conf.isTagFinding) && !$sotd.length)
                    msg.pub("error", "A custom SotD paragraph is required for your type of document.");
                conf.sotdCustomParagraph = $sotd.html();
                $sotd.remove();
                // NOTE:
                //  When arrays, wg and wgURI have to be the same length (and in the same order).
                //  Technically wgURI could be longer but the rest is ignored.
                //  However wgPatentURI can be shorter. This covers the case where multiple groups
                //  publish together but some aren't used for patent policy purposes (typically this
                //  happens when one is foolish enough to do joint work with the TAG). In such cases,
                //  the groups whose patent policy applies need to be listed first, and wgPatentURI
                //  can be shorter — but it still needs to be an array.
                var wgPotentialArray = [conf.wg, conf.wgURI, conf.wgPatentURI];
                if (
                    wgPotentialArray.some(function (it) { return $.isArray(it); }) &&
                    wgPotentialArray.some(function (it) { return !$.isArray(it); })
                ) msg.pub("error", "If one of 'wg', 'wgURI', or 'wgPatentURI' is an array, they all have to be.");
                if ($.isArray(conf.wg)) {
                    conf.multipleWGs = conf.wg.length > 1;
                    conf.wgHTML = utils.joinAnd(conf.wg, function (wg, idx) {
                        return "the <a href='" + conf.wgURI[idx] + "'>" + wg + "</a>";
                    });
                    var pats = [];
                    for (var i = 0, n = conf.wg.length; i < n; i++) {
                        pats.push("a <a href='" + conf.wgPatentURI[i] + "' rel='disclosure'>"
                                  + "public list of any patent disclosures  (" + conf.wg[i]
                                  + ")</a>");
                    }
                    conf.wgPatentHTML = utils.joinAnd(pats);
                }
                else {
                    conf.multipleWGs = false;
                    conf.wgHTML = "the <a href='" + conf.wgURI + "'>" + conf.wg + "</a>";
                }
                if (conf.isLC && !conf.lcEnd) msg.pub("error", "Status is LC but no lcEnd is specified");
                if (conf.specStatus === "PR" && !conf.lcEnd) msg.pub("error", "Status is PR but no lcEnd is specified (needed to indicate end of previous LC)");
                conf.humanLCEnd = utils.humanDate(conf.lcEnd || "");
                if (conf.specStatus === "CR" && !conf.crEnd) msg.pub("error", "Status is CR but no crEnd is specified");
                conf.humanCREnd = utils.humanDate(conf.crEnd || "");
                if (conf.specStatus === "PR" && !conf.prEnd) msg.pub("error", "Status is PR but no prEnd is specified");
                conf.humanPREnd = utils.humanDate(conf.prEnd || "");
                conf.humanPEREnd = utils.humanDate(conf.perEnd || "");
                if (conf.specStatus === "PER" && !conf.perEnd) msg.pub("error", "Status is PER but no perEnd is specified");

                conf.recNotExpected = (!conf.isRecTrack && conf.maturity == "WD" && conf.specStatus !== "FPWD-NOTE");
                if (conf.isIGNote && !conf.charterDisclosureURI)
                    msg.pub("error", "IG-NOTEs must link to charter's disclosure section using charterDisclosureURI");
                // ensure subjectPrefix is encoded before using template
                if (conf.subjectPrefix !== "") conf.subjectPrefixEnc = encodeURIComponent(conf.subjectPrefix);
                var sotd;
                if (conf.isCGBG) sotd = cgbgSotdTmpl(conf);
                else if (conf.isWebSpec) sotd = null;
                else sotd = sotdTmpl(conf);
                if (sotd) $(sotd).insertAfter($("#abstract"));

                if (!conf.implementationReportURI && (conf.isCR || conf.isPR || conf.isRec)) {
                    msg.pub("error", "CR, PR, and REC documents need to have an implementationReportURI defined.");
                }
                if (conf.isTagFinding && !conf.sotdCustomParagraph) {
                    msg.pub("error", "ReSpec does not support automated SotD generation for TAG findings, " +
                                     "please specify one using a <code><section></code> element with ID=sotd.");
                }

                msg.pub("end", "w3c/headers");
                cb();
            }
        };
    }
);
