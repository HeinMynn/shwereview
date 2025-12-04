const message = `We are writing to inform you that your review for Test Business has been removed. This action was taken because the content was found to be in violation of our Community Guidelines specifically regarding: it contained hate speech. Please review our guidelines to ensure future contributions adhere to our standards.

[Community Guidelines](/community-guidelines)`;

const parts = message.split(/(\[.*?\]\(.*?\))/g);
console.log('Parts:', parts);

parts.forEach((part, i) => {
    const match = part.match(/\[(.*?)\]\((.*?)\)/);
    if (match) {
        console.log(`Match ${i}: Text='${match[1]}', Url='${match[2]}'`);
    } else {
        console.log(`No match ${i}: '${part}'`);
    }
});
