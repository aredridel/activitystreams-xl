const tape = require('tape');
const { parse } = require('../xml');
const jsonld = require('jsonld').promises;

const follow = `<?xml version="1.0"?>
<entry xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0" xmlns:activity="http://activitystrea.ms/spec/1.0/" xmlns:poco="http://portablecontacts.net/spec/1.0" xmlns:media="http://purl.org/syndication/atommedia" xmlns:ostatus="http://ostatus.org/schema/1.0" xmlns:mastodon="http://mastodon.social/schema/1.0">
  <id>tag:test2.yayforqueers.net,2017-05-13:objectId=16:objectType=Follow</id>
  <title>aredridel started following test2@test.yayforqueers.net</title>
  <content type="html">aredridel started following test2@test.yayforqueers.net</content>
  <author>
    <id>http://test2.yayforqueers.net/users/aredridel</id>
    <activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>
    <uri>http://test2.yayforqueers.net/users/aredridel</uri>
    <name>aredridel</name>
    <email>aredridel@test2.yayforqueers.net</email>
    <summary type="html">&lt;p&gt;Testing 123&lt;/p&gt;</summary>
    <link rel="alternate" type="text/html" href="http://test2.yayforqueers.net/@aredridel"/>
    <link rel="avatar" type="" media:width="120" media:height="120" href="http://test2.yayforqueers.net/avatars/original/missing.png"/>
    <link rel="header" type="" media:width="700" media:height="335" href="http://test2.yayforqueers.net/headers/original/missing.png"/>
    <poco:preferredUsername>aredridel</poco:preferredUsername>
    <poco:displayName>Aria</poco:displayName>
    <poco:note>Testing 123</poco:note>
    <mastodon:scope>public</mastodon:scope>
  </author>
  <activity:object-type>http://activitystrea.ms/schema/1.0/activity</activity:object-type>
  <activity:verb>http://activitystrea.ms/schema/1.0/follow</activity:verb>
  <activity:object>
    <id>https://test.yayforqueers.net/users/test2</id>
    <activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>
    <uri>https://test.yayforqueers.net/users/test2</uri>
    <name>test2</name>
    <email>test2@test.yayforqueers.net</email>
    <link rel="alternate" type="text/html" href="https://test.yayforqueers.net/@test2"/>
    <link rel="avatar" type="image/png" media:width="120" media:height="120" href="http://test2.yayforqueers.net/system/accounts/avatars/000/000/002/original/media.png?1493850343"/>
    <link rel="header" type="" media:width="700" media:height="335" href="http://test2.yayforqueers.net/headers/original/missing.png"/>
    <poco:preferredUsername>test2</poco:preferredUsername>
    <poco:displayName>WIP2</poco:displayName>
    <mastodon:scope>public</mastodon:scope>
  </activity:object>
</entry>`;

const unfollow = `<?xml version="1.0"?>
<entry xmlns="http://www.w3.org/2005/Atom" xmlns:thr="http://purl.org/syndication/thread/1.0" xmlns:activity="http://activitystrea.ms/spec/1.0/" xmlns:poco="http://portablecontacts.net/spec/1.0" xmlns:media="http://purl.org/syndication/atommedia" xmlns:ostatus="http://ostatus.org/schema/1.0" xmlns:mastodon="http://mastodon.social/schema/1.0">
  <id>tag:test2.yayforqueers.net,2017-05-13:objectId=22:objectType=Follow</id>
  <title>aredridel is no longer following test2@test.yayforqueers.net</title>
  <content type="html">aredridel is no longer following test2@test.yayforqueers.net</content>
  <author>
    <id>http://test2.yayforqueers.net/users/aredridel</id>
    <activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>
    <uri>http://test2.yayforqueers.net/users/aredridel</uri>
    <name>aredridel</name>
    <email>aredridel@test2.yayforqueers.net</email>
    <summary type="html">&lt;p&gt;Testing 123&lt;/p&gt;</summary>
    <link rel="alternate" type="text/html" href="http://test2.yayforqueers.net/@aredridel"/>
    <link rel="avatar" type="" media:width="120" media:height="120" href="http://test2.yayforqueers.net/avatars/original/missing.png"/>
    <link rel="header" type="" media:width="700" media:height="335" href="http://test2.yayforqueers.net/headers/original/missing.png"/>
    <poco:preferredUsername>aredridel</poco:preferredUsername>
    <poco:displayName>Aria</poco:displayName>
    <poco:note>Testing 123</poco:note>
    <mastodon:scope>public</mastodon:scope>
  </author>
  <activity:object-type>http://activitystrea.ms/schema/1.0/activity</activity:object-type>
  <activity:verb>http://ostatus.org/schema/1.0/unfollow</activity:verb>
  <activity:object>
    <id>https://test.yayforqueers.net/users/test2</id>
    <activity:object-type>http://activitystrea.ms/schema/1.0/person</activity:object-type>
    <uri>https://test.yayforqueers.net/users/test2</uri>
    <name>test2</name>
    <email>test2@test.yayforqueers.net</email>
    <link rel="alternate" type="text/html" href="https://test.yayforqueers.net/@test2"/>
    <link rel="avatar" type="image/png" media:width="120" media:height="120" href="http://test2.yayforqueers.net/system/accounts/avatars/000/000/002/original/media.png?1493850343"/>
    <link rel="header" type="" media:width="700" media:height="335" href="http://test2.yayforqueers.net/headers/original/missing.png"/>
    <poco:preferredUsername>test2</poco:preferredUsername>
    <poco:displayName>WIP2</poco:displayName>
    <mastodon:scope>public</mastodon:scope>
  </activity:object>
</entry>`;

tape.test('parse follow', t => {
    return parse(follow).then(obj => {
	  t.ok(obj);
	  t.equal(obj.type, 'Follow');
	  return jsonld.expand(obj)
	}).then(e => {
	  t.equal(e[0]['https://www.w3.org/ns/activitystreams#content'][0]['@value'], 'aredridel started following test2@test.yayforqueers.net');
	})
	.catch(t.error)
	.then(t.end)
});

tape.test('parse unfolllow', t => {
    return parse(unfollow).then(obj => {
	  t.ok(obj);
	  t.equal(obj.type, 'Undo');
	  t.equal(obj.object.type, 'Follow');
	})
	.catch(t.error)
	.then(t.end);
});
