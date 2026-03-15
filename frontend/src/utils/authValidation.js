import * as yup from 'yup';

export const loginSchema = yup.object({
  email: yup
    .string()
    .trim()
    .required('Email is required.')
    .email('Enter a valid email address.'),
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters.'),
});

export const registerSchema = yup.object({
  username: yup
    .string()
    .trim()
    .required('Username is required.')
    .min(3, 'Username must be at least 3 characters.')
    .max(50, 'Username must be 50 characters or fewer.'),
  email: yup
    .string()
    .trim()
    .required('Email is required.')
    .email('Enter a valid email address.'),
  password: yup
    .string()
    .required('Password is required.')
    .min(8, 'Password must be at least 8 characters.')
    .matches(/[a-z]/, 'Password needs at least one lowercase letter.')
    .matches(/[A-Z]/, 'Password needs at least one uppercase letter.')
    .matches(/[0-9]/, 'Password needs at least one number.'),
  confirm: yup
    .string()
    .required('Please confirm your password.')
    .oneOf([yup.ref('password')], 'Passwords do not match.'),
});

function mapYupErrors(error) {
  const nextErrors = {};

  if (error?.inner?.length) {
    for (const item of error.inner) {
      if (item.path && !nextErrors[item.path]) {
        nextErrors[item.path] = item.message;
      }
    }
    return nextErrors;
  }

  if (error?.path) {
    nextErrors[error.path] = error.message;
  }

  return nextErrors;
}

export async function validateAuthForm(schema, values) {
  try {
    await schema.validate(values, { abortEarly: false });
    return {};
  } catch (error) {
    return mapYupErrors(error);
  }
}

export async function validateAuthField(schema, field, values) {
  try {
    await schema.validateAt(field, values);
    return '';
  } catch (error) {
    return error.message;
  }
}
