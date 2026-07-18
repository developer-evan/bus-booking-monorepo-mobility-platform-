import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

@ValidatorConstraint({ name: 'requireEmailOrPhone', async: false })
export class RequireEmailOrPhoneConstraint implements ValidatorConstraintInterface {
  validate(_value: unknown, args: ValidationArguments): boolean {
    const object = args.object as { email?: string; phone?: string };
    return Boolean(object.email?.trim() || object.phone?.trim());
  }

  defaultMessage(): string {
    return 'Either email or phone must be provided';
  }
}

export function RequireEmailOrPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: RequireEmailOrPhoneConstraint,
    });
  };
}
