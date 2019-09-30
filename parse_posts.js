/**
 * Copyright 2017, Sheldon Rampton.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * This is a utility script to extract information from a Facebook archive
 * of user posts. It parses out the JSON data from the archive to create a
 * simplified JSON structure, which it then feeds to a Python script named
 * generate_training_set.py. The Python script uses Python's Natural Language
 * Toolkit (nltk) to break each post down into individual sentences, which
 * it then outputs as a single line of JSON-encoded data that can serve
 * as a row in a training dataset for the cakechat bot:
 *   https://github.com/lukalabs/cakechat.git
 *
 * USAGE:
 *   node parse_posts.js -f facebook.json 
 */

const yargs = require('yargs');
let {PythonShell} = require('python-shell');

const argv = yargs
  .options({
    f: {
      demand: false,
      alias: 'file',
      describe: 'JSON file to load',
      string: true
    },
    // k: {
    //   demand: false,
    //   alias: 'key',
    //   describe: 'Key to output',
    //   string: true
    // },
    // d: {
    //   demand: false,
    //   alias: 'datatype',
    //   describe: 'Datatype to output',
    //   string: true
    // },
    v: {
      demand: false,
      alias: 'verbose',
      describe: 'Verbose output',
      boolean: false
    }
  })
  .help()
  .alias('help', 'h')
  .argv;

const fs = require('fs');

/**
 * simplifytPosts
 * 
 * Parses a Facebook posts archive (JSON format) into a
 * simplified structure. 
 *
 * Arguments:
 * - file (string): the name of the Facebook posts archive file.
 * 
 * Return:
 *   JSON text for an array, with the following values for each post:
 *   - timestamp: the timestamp for the post
 *.  - url: a URL for the post (optional)
 *   - category: the source or author of the post
 *.  - description: a description of the post. In some cases, this may
 *.    be identical to the post text.
 *.  - post: the actual text of the post
 */
const simplifyPosts = (file) => {
  var postsOut = [];
  if (argv.file) {
    var postFile = fs.readFileSync(argv.file);
    var posts = JSON.parse(postFile);
    posts.forEach((post, index) => {
      var attachOut = [];
      var postOut = {};
      timestamp = post['timestamp'];
      date = new Date(Number(post['timestamp'])*1000).toDateString();
      if (typeof(post['attachments']) != "undefined") {
        post['attachments'].forEach((attachment, index) => {
          var datatype = Object.keys(attachment['data'][0])[0];
          switch (datatype) {
            // console.log(`EXTERNAL CONTEXT: ${attachment['data'][0][datatype]['url']}`);
            case 'external_context':
              var category = '';
              var description = '';
              var url = attachment['data'][0][datatype]['url'];
              if (typeof(attachment['data'][0][datatype]['source']) != "undefined") {
                // console.log(attachment['data'][0][datatype]['source']);
                category = attachment['data'][0][datatype]['source'];
              }
              if (typeof(attachment['data'][0][datatype]['name']) != "undefined") {
                // console.log(attachment['data'][0][datatype]['name']);
                description = attachment['data'][0][datatype]['name'];
              }
              attachOut.push({
                'category': category,
                'description': description,
                'url': url
              });
              break;

            case 'media':
              // console.log(`MEDIA: ${attachment['data'][0][datatype]['uri']}`);
              var category = '';
              var description = '';
              var url = attachment['data'][0][datatype]['uri'];
              if (typeof(attachment['data'][0][datatype]['title']) != "undefined") {
                // console.log(attachment['data'][0][datatype]['title']);
                category = attachment['data'][0][datatype]['title'];
              }
              if (typeof(attachment['data'][0][datatype]['description']) != "undefined") {
                // console.log(attachment['data'][0][datatype]['description']);
                description = attachment['data'][0][datatype]['description'];
              }
              var prev_comment = null;
              if (typeof(attachment['data'][0][datatype]['comments']) != "undefined") {
                attachment['data'][0][datatype]['comments'].forEach((comment, index) => {
                  if (typeof(prev_comment) != null &&
                    comment['author'] == 'Sheldon M Rampton') { 
                      postsOut.push({
                        'timestamp': timestamp,
                        'category': prev_comment['author'],
                        'description': prev_comment['comment'],
                        'url': '',
                        'post': comment['comment']
                      });
                  }
                  prev_comment = comment;
                });
                // console.log(JSON.stringify(attachment['data'][0][datatype]['comments'], null, 2));
              }
              attachOut.push({
                'category': category,
                'description': description,
                'url': url
              });
              break;

            // case 'text':
            //   console.log(`TEXT: ${attachment['data'][0][datatype]}`);
            //   break;
            // case 'event':
            //   console.log(`EVENT: ${attachment['data'][0][datatype]['name']}`);
            //   break;
            // case 'fundraiser':
            //   console.log(`FUNDRAISER: ${attachment['data'][0][datatype]['title']}`);
            //   break;
            // case 'place':
            //   console.log(`PLACE: ${attachment['data'][0][datatype]['name']}`);
            //   break;
            default:
              break;
          }
        });
      }
      if (typeof(post['data']) != "undefined" && typeof(post['data'][0]) != "undefined"
              && typeof(post['data'][0]['post']) != "undefined") {
        post = post['data'][0]['post'];
        if (attachOut.length > 0) {
          attachOut.forEach((attach, index) => {
            if (attach.category != '') {
              postsOut.push({
                'timestamp': timestamp,
                'url': attach.url,
                'category': attach.category,
                'description': attach.description,
                'post': post
              });
            }
          });
        }
        else {
          postsOut.push({
            'timestamp': timestamp,
            'url': '',
            'category': '',
            'description': post,
            'post': post
          });
        }

      }
    });
  }
  if (argv.verbose) {
    console.log(JSON.stringify(postsOut, null, 2));
  }
  return postsOut;
}

simplified = simplifyPosts(argv.file);
// Create a python shell to run the script that breaks each
// post into sentences.
let pyshell = new PythonShell('generate_training_set.py');
pyshell.send(JSON.stringify(simplified));
pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);
});
pyshell.end(function (err,code,signal) {
  if (err) throw err;
});
