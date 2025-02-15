export function makeTitle(name: string) {

  // insert a space before all caps
  return name.replace(/([A-Z])/g, ' $1')
    // uppercase the first character
    .replace(/^./, (str) => str.toUpperCase()).replace('Email', 'eMail').replace(" I D", " ID");

}

export function isFunction(functionToCheck: any) {
  var getType = {};
  return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
}
export function functionOrString(f: string | (() => string)): string {
  if (isFunction(f)) {
    let x = f as any;
    return x();
  }
  return f.toString();
}
