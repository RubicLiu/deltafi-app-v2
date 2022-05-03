const idl = require("./src/anchor/idl/deltafi_dex_v2.json");
const datatypes = idl.types;
const accountTypes = idl.accounts;
const primitiveTypesMapping = {
  "u128": "BigInt",
  "u64": "BigInt",
  "i64": "BigInt",
  "u32": "number",
  "i32": "number",
  "u16": "number",
  "u8": "number",
  "bool": "boolean",
  "publickey": "PublicKey"
};

const parseType = (field) => {
  if (field.name.includes("reserve")) {
    return null;
  }
  if (field.type.defined) {
    return field.type.defined;
  }

  return primitiveTypesMapping[field.type];
}

const getTypeDefinition = (typeDefinitionJson) => {
  if (typeDefinitionJson.type.kind === "struct") {
    return generateStructDefinition(typeDefinitionJson.name, typeDefinitionJson.type.fields)
  }
  else if (typeDefinitionJson.type.kind === "enum") {
    return generateEnumDefinition(typeDefinitionJson.name, typeDefinitionJson.type.variants);
  }
}

const generateStructDefinition = (structName, structFields) => {
  const strList = ["export interface " + structName + " {"];
  structFields.forEach((field) => {
    const fieldType = parseType(field);
    if (!fieldType) {
      return;
    }
    strList.push("  " + field.name + ": " + fieldType + ";");
  })
  strList.push("}");
  return strList.join("\n");
}

const generateEnumDefinition = (enumName, enumVariants) => {
  const strList = ["export enum " + enumName + " {"];
  enumVariants.forEach((variant) => {
    strList.push("  " + variant.name + ",");
  })
  strList.push("}");
  return strList.join("\n");
}

const main = () => {
  const definitionList = []
  const types = datatypes.concat(accountTypes);
  types.forEach((type) => {
    definitionList.push(getTypeDefinition(type));
  })

  console.info(definitionList.join("\n\n"));
}

main();
