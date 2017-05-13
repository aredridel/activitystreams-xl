const ltx = require('ltx');

const ATOMNS = 'http://www.w3.org/2005/Atom';
const ACTIVITYNS = 'http://activitystrea.ms/spec/1.0/';
const POCONS = "http://portablecontacts.net/spec/1.0";
const MASTODONNS = "http://mastodon.social/schema/1.0";
const url = require('url');
const error = require('./error');
const as2tables = require('./tables');

module.exports = {
    parse
};

function parse(xml) {
    const atom = ltx.parse(xml);
    if (atom.is('feed', ATOMNS)) {
        return {items: atom.children.map(entry2as2)};
    } else if (atom.is ('entry', ATOMNS) || atom.is('object', ACTIVITYNS) || atom.is('target', ACTIVITYNS)) {
        return {items: [ entry2as2(atom) ] };
    } else {
        throw new Error(`unrecognized type of element ${atom.name})`);
    }
}

function entry2as2(el) {
    const type = typeForIRI(getText(el, 'verb', ACTIVITYNS) || getText(el, 'object-type', ACTIVITYNS)) || 'Add';
    const id = getText(el, 'id', ATOMNS);

    const out = {
        id,
        title: getText(el, 'title', ATOMNS),
        content: getText(el, 'content', ATOMNS),
        actor: elementToAs2(el.getChild('author', ATOMNS)),
        type,
        object: elementToAs2(el.getChild('object', ACTIVITYNS)),
        target: elementToAs2(el.getChild('target', ACTIVITYNS)),
    };

    return out;
}

function getText(el, name, ns) {
    const sub = el.getChild(name, ns)
    if (sub) return sub.getText();
}


function elementToAs2(el) {
    // TODO: figure out if this is an implicit or explicit event
    if (!el) return;
    const objectTypeUrl = getText(el, 'object-type', ACTIVITYNS);
    const objectType = typeForIRI(objectTypeUrl) || error(`unknown type '${objectTypeUrl}'`);

    return {
        id: getText(el, 'id', ATOMNS),
        uri: getText(el, 'uri', ATOMNS),
        name: getText(el, 'name', POCONS),
        'mastodon:scope': getText(el, 'scope', MASTODONNS),
        // Handle links?
        email: getText(el, 'email', ATOMNS),
        name: getText(el, 'displayName', POCONS),
        'poco:displayName': getText(el, 'displayName', POCONS),
        'poco:preferredUsername': getText(el, 'preferredUsername', POCONS),
        objectType,
    };
}

function typeForIRI(iri) {
    iri = url.resolve('http://activitystrea.ms/schema/1.0/', iri);
    if (as2tables.legacyTypes[iri]) iri = as2tables.legacyTypes[iri];
    return as2tables.byURI[iri] ?  as2tables.byURI[iri].name : null;
    
    // TODO: handle ostatus URLs.
    // TODO: handle as 1.0 URLs.
}
