export class BytesInBinaryToInternacionalSystem {
  private static BINARY_CONVERSION_FACTOR = 1024;
  private static SI_CONVERSION_FACTOR = 1000;

  static run(bytes: number) {
    if (bytes === 0) {
      return 0;
    }

    const exponent = Math.floor(
      Math.log(bytes) /
        Math.log(BytesInBinaryToInternacionalSystem.BINARY_CONVERSION_FACTOR)
    );

    const bin =
      bytes /
      Math.pow(
        BytesInBinaryToInternacionalSystem.BINARY_CONVERSION_FACTOR,
        exponent
      );

    return (
      bin *
      Math.pow(
        BytesInBinaryToInternacionalSystem.SI_CONVERSION_FACTOR,
        exponent
      )
    );
  }
}
