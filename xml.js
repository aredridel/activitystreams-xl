const ltx = require('ltx');

const ATOMNS = 'http://www.w3.org/2005/Atom';
const ACTIVITYNS = 'http://activitystrea.ms/spec/1.0/';
const POCONS = "http://portablecontacts.net/spec/1.0";
//const MASTODONNS = "http://mastodon.social/schema/1.0";
const url = require('url');
//const error = require('./error');
const as2tables = require('./tables');
const jsonld = require('jsonld').promises;

module.exports = {
  parse
};

function parse(xml) {
  const atom = ltx.parse(xml);
  if (atom.is('feed', ATOMNS)) {
    return atom.children.map(entry2as2).then(entries => ({
      items: entries
    }));
  } else if (atom.is('entry', ATOMNS) || atom.is('object', ACTIVITYNS) || atom.is('target', ACTIVITYNS)) {
    return Promise.resolve(entry2as2(atom));
  } else {
    return Promise.reject(new Error(`unrecognized type of element ${atom.name})`));
  }
}

function entry2as2(el) {
  // if is implicit, return implicit2as2
  // else
  const as1 = entry2as1(el);
  return jsonld.compact(addContext(as1ToAS2(as1)), 'https://www.w3.org/ns/activitystreams');
}

function as1ToAS2(obj) {
  if (!obj) return;
  const type = typeForIRI(obj.verb || obj.objectType) || 'https://www.w3.org/ns/activitystreams#Add';
  const object = as1ToAS2(obj.object);
  const actor = as1ToAS2(obj.actor);

  const out = Object.assign({}, obj, {
    type,
    actor,
    object
  });
  delete out.verb;
  delete out.objectType;

  if (type == 'http://ostatus.org/schema/1.0/unfollow') {
    return synthesizeUndoRecord(Object.assign(out, {
      type: 'https://www.w3.org/ns/activitystreams#Follow'
    }));
  } else {
    return out;
  }
}

function addContext(obj) {
  return Object.assign({
    '@context': 'https://www.w3.org/ns/activitystreams'
  }, obj);
}

function entry2as1(el) {
  if (!el) return;
  const verb = getText(el, 'verb', ACTIVITYNS);
  const objectType = getText(el, 'object-type', ACTIVITYNS);

  const out = {};

  Object.assign(out, el.children.reduce((obj, c) => {
    if (typeof c == 'string') return obj;
    const prop = canonicalPropertyName(c.getNS(), c.getName());
    const value = getConverter(prop)(c);
    obj[prop] = value;
    return obj;
  }, {}))

  Object.assign(out, {
    actor: entry2as1(el.getChild('author', ATOMNS)),
    verb,
    objectType,
    object: entry2as1(el.getChild('object', ACTIVITYNS)),
    target: entry2as1(el.getChild('target', ACTIVITYNS)),
  });

  return out;
}

function canonicalPropertyName(ns, name) {
  if (ns == 'http://www.w3.org/2005/Atom') {
    if (name == 'author') {
      return 'actor';
    } else if (name == 'title') {
      return 'summary';
    } else {
      return name;
    }
  } else if (ns == ACTIVITYNS) {
    if (name == 'object-type') {
      return 'objectType';
    } else {
      return name;
    }
  } else if (ns == POCONS) {
    return name;
  } else {
    return ns + name;
  }
}

function getConverter(prop) {
  switch (prop) {
    case 'actor':
    case 'object':
    case 'target':
      return entry2as1;
    case 'link':
      return extractLink;
    default:
      return extractText;
  }
}

function extractLink(el) {
  // FIXME: media attributes etc.
  return Object.assign({}, el.attrs, {
    type: 'https://www.w3.org/ns/activitystreams#Link'
  });
}

function extractText(child) {
  return child.getText();
}

function getText(el, name, ns) {
  const sub = el.getChild(name, ns)
  if (sub) return sub.getText();
}

/*FIXME
function elementToAs2(el) {
    // TODO: figure out if this is an implicit or explicit event
    if (!el) return;
    const objectTypeUrl = getText(el, 'object-type', ACTIVITYNS);
    const objectType = typeForIRI(objectTypeUrl) || error(`unknown type '${objectTypeUrl}'`);

    const out = {
        '@type': objectType,
        '@id': getText(el, 'id', ATOMNS),
        uri: getText(el, 'uri', ATOMNS),
        name: getText(el, 'name', POCONS),
        'mastodon:scope': getText(el, 'scope', MASTODONNS),
        // Handle links?
        email: getText(el, 'email', ATOMNS),
        name: getText(el, 'displayName', POCONS),
        'poco:displayName': getText(el, 'displayName', POCONS),
        'poco:preferredUsername': getText(el, 'preferredUsername', POCONS),
    };

}
*/

function synthesizeUndoRecord(object) {
  return {
    type: 'https://www.w3.org/ns/activitystreams#Undo',
    object
  }
}

function typeForIRI(iri) {
  iri = url.resolve('http://activitystrea.ms/schema/1.0/', iri);
  if (as2tables.legacyTypes[iri])
    iri = as2tables.legacyTypes[iri];
  return as2tables.byURI[iri] ? as2tables.byURI[iri].uri : iri;

// TODO: handle ostatus URLs.
}
