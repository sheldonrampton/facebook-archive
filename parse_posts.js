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
    k: {
      demand: false,
      alias: 'key',
      describe: 'Key to output',
      string: true
    },
    d: {
      demand: false,
      alias: 'datatype',
      describe: 'Datatype to output',
      string: true
    },
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


let pyshell = new PythonShell('generate_training_set.py');

pyshell.send(JSON.stringify(simplified));

pyshell.on('message', function (message) {
  // received a message sent from the Python script (a simple "print" statement)
  console.log(message);
});

pyshell.end(function (err,code,signal) {
  if (err) throw err;
});
